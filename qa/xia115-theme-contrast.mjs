const L = (r,g,b)=>{const f=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4};const[R,G,B]=[f(r),f(g),f(b)];return 0.2126*R+0.7152*G+0.0722*B};
const ratio=(a,b)=>{const l1=L(...a),l2=L(...b);const[hi,lo]=l1>l2?[l1,l2]:[l2,l1];return (hi+0.05)/(lo+0.05)};
// dark preview surfaces
const surface=[28,24,21];        // espresso-900 (bg-surface do preview)
const surfaceRaised=[36,31,26];  // espresso-850 (linhas de serviço / badge)
const espresso950=[20,17,14];    // ink escuro p/ texto-sobre-cor (accent-ink atual)
const bone100=[243,236,224];     // ink claro alternativo p/ texto-sobre-cor

// candidatos de tema (bright, on-brand dark premium)
const cands={
  'brass-400 #D6A24E':[214,162,78],
  'brass-300 #E0B25E':[224,178,94],
  'copper #E0916A':[224,145,106],
  'rust-300 #E8886B':[232,136,107],
  'terracotta #E39B76':[227,155,118],
  'sage #93C892':[147,200,146],
  'green-300 #7BC47F':[123,196,127],
  'steel-300 #7FB2D9':[127,178,217],
  'azure #86B8DE':[134,184,222],
  'mauve #C79BD1':[199,155,209],
  'lilac #B79BD6':[183,155,214],
  'amber-300 #E8B84B':[232,184,75],
};
console.log('cor'.padEnd(22),'txt/surface  txt/raised  ink950/cor  bone/cor  → melhor ink');
for(const[k,c]of Object.entries(cands)){
  const tS=ratio(c,surface), tR=ratio(c,surfaceRaised);
  const iD=ratio(c,espresso950), iB=ratio(c,bone100);
  const best=iD>=iB?`espresso950 ${iD.toFixed(2)}`:`bone100 ${iB.toFixed(2)}`;
  console.log(k.padEnd(22), tS.toFixed(2).padStart(6), tR.toFixed(2).padStart(10), iD.toFixed(2).padStart(10), iB.toFixed(2).padStart(9), ' ', best);
}
