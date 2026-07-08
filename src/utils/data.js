// ============================================================
// utils/data.js
// Formata datas ISO no padrão dd/mm/aaaa hh:mm.
// ============================================================

function formatarDataHora(isoString) {
  const d = new Date(isoString);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

module.exports = { formatarDataHora };
