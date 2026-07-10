// Stub vazio para o `polyfill-module.js` do Next (Perf XIA-76).
// O browserslist floor (Chrome 100+/Safari 16+ — cf. package.json) suporta
// NATIVAMENTE tudo que aquele arquivo injeta (Array.flat/at, Object.fromEntries/
// hasOwn, Promise.finally, Symbol.description, String.trimStart, URL). Browsers
// abaixo do floor continuam cobertos pelo bundle `nomodule` (polyfill-nomodule.js),
// servido só para eles. Resultado: ~11 KiB de JS legado a menos no bundle moderno.
export {};
