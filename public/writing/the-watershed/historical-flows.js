// Historical relationships, not reconstructed monetary accounts.
// Ribbon widths are illustrative and conserved at each junction.
const colors = ['#a77740', '#317d90', '#376853', '#a5946e'];
const ribbon = (x1, y1, x2, y2, width, color) => {
  const mid = (y1 + y2) / 2;
  return `<path fill="${color}" fill-opacity=".48" d="M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2} H${x2 + width} C${x2 + width} ${mid} ${x1 + width} ${mid} ${x1 + width} ${y1} Z"/>`;
};
const label = (x, y, lines) => `<text x="${x}" y="${y}" text-anchor="middle">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? 17 : 0}">${line}</tspan>`).join('')}</text>`;
const node = (x, y, width, color) => `<rect x="${x}" y="${y}" width="${width}" height="7" rx="1" fill="${color}"/>`;

for (const svg of document.querySelectorAll('[data-glasgow]')) {
  const invest = svg.dataset.glasgow === 'invest';
  let drawing = '';
  if (invest) {
    drawing += label(195, 32, ['Tobacco surplus']);
    drawing += node(115, 49, 160, colors[0]);
    drawing += ribbon(115, 56, 115, 160, 160, colors[0]);
    drawing += '<rect class="historical-pool" x="95" y="160" width="200" height="65" rx="9"/>';
    drawing += label(195, 187, ['Capital kept', 'for investment']);
    const names = [['Banking'], ['Sugar'], ['Ironworks'], ['Textile', 'printing']];
    for (let i = 0; i < 4; i++) {
      const x = 24 + i * 94;
      drawing += ribbon(115 + i * 40, 225, x, 347, 40, colors[i]);
      drawing += node(x, 347, 40, colors[i]);
      drawing += label(x + 20, 379, names[i]);
    }
  } else {
    const names = [['Tobacco', 'disrupted'], ['Sugar', 'trade'], ['Cotton +', 'textiles'], ['Other', 'businesses']];
    const widths = [8, 54, 60, 38];
    let destination = 115;
    for (let i = 0; i < 4; i++) {
      const center = 44 + i * 99;
      drawing += label(center, 27, names[i]);
      if (!i) drawing += '<path d="M24 64 H64" stroke="#a77740" stroke-width="7" opacity=".18"/>';
      drawing += node(center - widths[i] / 2, 61, widths[i], colors[i]);
      drawing += ribbon(center - widths[i] / 2, 68, destination, 218, widths[i], colors[i]);
      destination += widths[i];
    }
    drawing += '<rect class="historical-pool" x="95" y="218" width="200" height="62" rx="9"/>';
    drawing += label(195, 245, ['Income earned', 'across Glasgow']);
    const bottom = [['Wages'], ['Trade +', 'suppliers'], ['Further', 'investment']];
    const widthsOut = [56, 56, 48];
    let source = 115;
    for (let i = 0; i < 3; i++) {
      const x = 35 + i * 130;
      drawing += ribbon(source, 280, x, 389, widthsOut[i], colors[i + 1]);
      drawing += node(x, 389, widthsOut[i], colors[i + 1]);
      drawing += label(x + widthsOut[i] / 2, 422, bottom[i]);
      source += widthsOut[i];
    }
  }
  svg.innerHTML = drawing;
}
