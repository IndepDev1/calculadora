// suspensiones.js (ES Module)
// Exporta:
// - FECHAS_CIERRE: Set("YYYY-MM-DD") con todas las fechas suspendidas
// - RESOLUCION_POR_FECHA: Map("YYYY-MM-DD" -> "Resolución / Circular ...")

const two = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

function ddmmyyyyToDate(s) {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// 🏛️ Resoluciones de suspensión (2019-2026)
const RESOLUCIONES_SUSPENSION = [
  // 2019
  { resolucion: "RESOLUCIÓN No. 89072 del 7 de diciembre de 2018", inicio: "02/01/2019", fin: "09/01/2019" },
  { resolucion: "RESOLUCIÓN No. 27362 del 11 de julio de 2019", inicio: "11/07/2019", fin: "11/07/2019" },
  { resolucion: "RESOLUCIÓN No. 63613 del 15 de noviembre de 2019", inicio: "03/12/2019", fin: "03/12/2019" },
  { resolucion: "RESOLUCIÓN No. 64600 del 20 de noviembre de 2019", inicio: "30/12/2019", fin: "10/01/2020" },

  // 2020
  { resolucion: "RESOLUCIÓN No. 11790 del 16 de marzo de 2020", inicio: "17/03/2020", fin: "30/04/2020" },
  { resolucion: "RESOLUCIÓN No. 24907 del 29 de mayo de 2020", inicio: "01/05/2020", fin: "30/06/2020" },
  { resolucion: "RESOLUCIÓN No. 70723 del 6 de noviembre de 2020", inicio: "13/11/2020", fin: "13/11/2020" },
  { resolucion: "RESOLUCIÓN No. 77618 del 1 de diciembre de 2020", inicio: "19/12/2020", fin: "11/01/2021" },

  // 2021
  { resolucion: "RESOLUCIÓN No. 12748 del 11 de marzo de 2021", inicio: "12/03/2021", fin: "12/03/2021" },
  { resolucion: "RESOLUCIÓN No. 57281 del 6 de septiembre de 2021", inicio: "06/09/2021", fin: "06/09/2021" },
  { resolucion: "RESOLUCIÓN No. 79759 del 6 de diciembre de 2021", inicio: "20/12/2021", fin: "10/01/2022" },

  // 2022
  { resolucion: "RESOLUCIÓN No. 87558 del 9 de diciembre de 2022", inicio: "19/12/2022", fin: "11/01/2023" },

  // 2023
  { resolucion: "RESOLUCIÓN No. 54645 del 12 de septiembre de 2023", inicio: "12/09/2023", fin: "13/09/2023" },
  { resolucion: "RESOLUCIÓN No. 54656 del 13 de septiembre de 2023", inicio: "14/09/2023", fin: "15/09/2023" },
  { resolucion: "RESOLUCIÓN No. 63599 del 18 de octubre de 2023", inicio: "18/10/2023", fin: "18/10/2023" },
  { resolucion: "RESOLUCIÓN No. 72982 del 21 de noviembre de 2023", inicio: "24/11/2023", fin: "27/11/2023" },
  { resolucion: "RESOLUCIÓN No. 74254 del 28 de noviembre de 2023", inicio: "28/11/2023", fin: "28/11/2023" },
  { resolucion: "RESOLUCIÓN No. 79172 del 14 de diciembre de 2023", inicio: "20/12/2023", fin: "14/01/2024" },

  // 2024
  { resolucion: "RESOLUCIÓN No. 18987 del 18 de abril de 2024", inicio: "24/04/2024", fin: "10/06/2024" },
  { resolucion: "Circular interna 013 del 18 de abril de 2024", inicio: "19/04/2024", fin: "19/04/2024" },
  { resolucion: "Circular interna 017 del 12 de julio de 2024", inicio: "15/07/2024", fin: "15/07/2024" },
  { resolucion: "RESOLUCIÓN No. 48972 del 27 de agosto de 2024", inicio: "27/08/2024", fin: "27/08/2024" },
  { resolucion: "RESOLUCIÓN No. 49390 del 28 de agosto de 2024", inicio: "28/08/2024", fin: "28/08/2024" },
  { resolucion: "RESOLUCIÓN No. 77546 del 11 de diciembre de 2024", inicio: "20/12/2024", fin: "10/01/2025" },

  // 2025
  { resolucion: "Circular interna 06 del 17 de marzo de 2025", inicio: "18/03/2025", fin: "18/03/2025" },
  { resolucion: "RESOLUCIÓN No. 106340 del 12 de diciembre de 2025", inicio: "22/12/2025", fin: "09/01/2026" },
];

function buildSuspension() {
  const set = new Set();
  const resolByDate = new Map();

  for (const item of RESOLUCIONES_SUSPENSION) {
    const ini = ddmmyyyyToDate(item.inicio);
    const fin = ddmmyyyyToDate(item.fin);
    for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
      const key = ymd(d);
      set.add(key);
      resolByDate.set(key, item.resolucion);
    }
  }

  return { set, resolByDate };
}

const { set: FECHAS_CIERRE, resolByDate: RESOLUCION_POR_FECHA } = buildSuspension();

export { FECHAS_CIERRE, RESOLUCION_POR_FECHA };
