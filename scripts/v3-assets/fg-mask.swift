// Foreground mask via macOS Vision (VNGenerateForegroundInstanceMaskRequest, macOS 14+).
// ============================================================================
// Usage (from the repo root):
//   swift scripts/v3-assets/fg-mask.swift <input image> <output.pgm> [all | 1,2]
//   # faster when run many times:
//   swiftc -O scripts/v3-assets/fg-mask.swift -o /tmp/fg-mask && /tmp/fg-mask in.png out.pgm
//
// Writes the soft foreground confidence (0..1 → 0..255) at the input's pixel size as an 8-bit
// binary PGM. PGM on purpose: a PNG written through CoreGraphics carries a grey colour profile
// that sharp would gamma-convert, silently shifting every soft edge value. Read it with
// readPgm() from lib.mjs. Prints the detected instance ids; pass a comma list to keep only
// some instances (default: all).
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("usage: fgmask <in> <out> [all|1,2]")
    exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let which = args.count >= 4 ? args[3] : "all"

guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil),
      let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    print("cannot read input")
    exit(1)
}
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
do {
    try handler.perform([req])
} catch {
    print("vision error: \(error)")
    exit(1)
}
guard let obs = req.results?.first else {
    print("no foreground found")
    exit(3)
}
print("instances: \(obs.allInstances.count) -> \(Array(obs.allInstances))")
var set = obs.allInstances
if which != "all" {
    set = IndexSet(which.split(separator: ",").compactMap { Int($0) })
}
do {
    let buf = try obs.generateScaledMaskForImage(forInstances: set, from: handler)
    // Write the raw float confidence (0..1) as an 8-bit binary PGM: no colour profile, no gamma.
    CVPixelBufferLockBaseAddress(buf, .readOnly)
    let w = CVPixelBufferGetWidth(buf)
    let h = CVPixelBufferGetHeight(buf)
    let rowBytes = CVPixelBufferGetBytesPerRow(buf)
    let base = CVPixelBufferGetBaseAddress(buf)!
    var bytes = [UInt8](repeating: 0, count: w * h)
    for y in 0..<h {
        let row = base.advanced(by: y * rowBytes).assumingMemoryBound(to: Float32.self)
        for x in 0..<w {
            let v = max(0, min(1, row[x]))
            bytes[y * w + x] = UInt8((v * 255).rounded())
        }
    }
    CVPixelBufferUnlockBaseAddress(buf, .readOnly)
    var data = Data("P5\n\(w) \(h)\n255\n".utf8)
    data.append(contentsOf: bytes)
    try data.write(to: outURL)
    print("wrote \(outURL.path) \(w)x\(h)")
} catch {
    print("mask error: \(error)")
    exit(1)
}
