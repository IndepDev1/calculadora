import { FECHAS_CIERRE, RESOLUCION_POR_FECHA } from "./suspensiones.js";

document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // Utilidades
  // =========================
  const two = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}`;
  const ymd = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
  const parseYMD = (s) => {
    const [y, m, da] = s.split("-").map(Number);
    return new Date(y, m - 1, da);
  };
  const el = (id) => document.getElementById(id);

  function renderResultados(lineas) {
    const cont = el("res_text");
    cont.replaceChildren();

    const tabla = document.createElement("table");
    tabla.className = "tabla-resultados";
    const tbody = document.createElement("tbody");

    lineas.forEach((linea, index) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      const td = document.createElement("td");

      const sep = linea.indexOf(":");
      if (sep >= 0) {
        th.textContent = linea.slice(0, sep);
        td.textContent = linea.slice(sep + 1).trimStart();
      } else {
        th.textContent = linea;
        td.textContent = "";
      }

      tr.append(th, td);
      tbody.appendChild(tr);

      if ((index + 1) % 2 === 0 && index < lineas.length - 1) {
        const espacio = document.createElement("tr");
        espacio.className = "resultado-espacio";
        espacio.setAttribute("aria-hidden", "true");
        espacio.innerHTML = '<td colspan="2"></td>';
        tbody.appendChild(espacio);
      }
    });

    tabla.appendChild(tbody);
    cont.appendChild(tabla);
  }

  // =========================
  // Festivos Colombia (cálculo)
  // =========================
  /**
   * Calcula la fecha de Pascua gregoriana para un año.
   *
   * @param {number} year - Año de consulta.
   * @returns {Date} Fecha local del domingo de Pascua.
   */
  function easterDate(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = 1 + ((h + l - 7 * m + 114) % 31);
    return new Date(year, month - 1, day);
  }

  /**
   * Traslada una fecha al lunes siguiente, o la conserva si ya es lunes.
   *
   * @param {Date} d - Fecha de referencia.
   * @returns {Date} Fecha correspondiente al lunes aplicable.
   */
  function siguienteLunes(d) {
    const day = d.getDay();
    if (day === 1) return d;
    const addDays = (8 - day) % 7;
    const nd = new Date(d);
    nd.setDate(nd.getDate() + addDays);
    return nd;
  }

  function addFest(set, date) { set.add(ymd(date)); }

  /**
   * Genera los festivos nacionales de Colombia para un rango anual inclusivo.
   *
   * @param {number} startY - Año inicial.
   * @param {number} endY - Año final.
   * @returns {Set<string>} Festivos en formato `YYYY-MM-DD`.
   * @remarks Aplica las reglas de traslado de la Ley Emiliani y los festivos religiosos.
   */
  function holidaysCOForYears(startY, endY) {
    const set = new Set();
    for (let y = startY; y <= endY; y++) {
      const pascua = easterDate(y);
      const d = (base, off) => { const nd = new Date(base); nd.setDate(nd.getDate() + off); return nd; };

      // Fijos
      addFest(set, new Date(y, 0, 1));
      addFest(set, new Date(y, 4, 1));
      addFest(set, new Date(y, 6, 20));
      addFest(set, new Date(y, 7, 7));
      addFest(set, new Date(y, 11, 8));
      addFest(set, new Date(y, 11, 25));

      // Emiliani
      addFest(set, siguienteLunes(new Date(y, 0, 6)));
      addFest(set, siguienteLunes(new Date(y, 2, 19)));
      addFest(set, siguienteLunes(new Date(y, 5, 29)));
      addFest(set, siguienteLunes(new Date(y, 7, 15)));
      addFest(set, siguienteLunes(new Date(y, 9, 12)));
      addFest(set, siguienteLunes(new Date(y, 10, 1)));
      addFest(set, siguienteLunes(new Date(y, 10, 11)));

      // Religiosos
      addFest(set, d(pascua, -3));
      addFest(set, d(pascua, -2));
      addFest(set, siguienteLunes(d(pascua, 39)));
      addFest(set, siguienteLunes(d(pascua, 60)));
      addFest(set, siguienteLunes(d(pascua, 68)));
    }
    return set;
  }

  // =========================
  // Helpers de cómputo
  // =========================
  /**
   * Determina si una fecha es hábil judicial.
   *
   * @param {Date} date - Fecha que se evaluará.
   * @param {Set<string>} festivos - Festivos nacionales.
   * @returns {boolean} `true` si no es fin de semana, festivo ni cierre judicial.
   */
  function esHabil(date, festivos) {
    const key = ymd(date);
    const day = date.getDay();
    return !FECHAS_CIERRE.has(key) && day >= 1 && day <= 5 && !festivos.has(key);
  }

  /**
   * Ajusta una fecha al primer día hábil en la misma fecha o después.
   *
   * @param {Date} date - Fecha de referencia.
   * @param {Set<string>} festivos - Festivos nacionales.
   * @returns {Date} Fecha hábil resultante.
   */
  function siguienteHabil(date, festivos) {
    const d = new Date(date);
    while (!esHabil(d, festivos)) d.setDate(d.getDate() + 1);
    return d;
  }

  /**
   * Suma días hábiles judiciales y conserva el detalle de cada fecha revisada.
   *
   * @param {Date} fechaInicio - Fecha base, que no se cuenta.
   * @param {number} cantidad - Días hábiles que se deben sumar.
   * @param {Set<string>} festivos - Festivos nacionales.
   * @returns {{fechaFinal: Date, logs: string[], hits: Array<{fecha: string, resolucion: string}>}}
   *     Fecha final, trazabilidad y cierres judiciales aplicados.
   */
  function sumarDiasHabilesJudiciales(fechaInicio, cantidad, festivos) {
    const logs = [];
    const hits = []; // {fecha:"YYYY-MM-DD", resolucion:"..."}

    let actual = new Date(fechaInicio);
    actual.setDate(actual.getDate() + 1);

    let cont = 0;
    const diasSemana = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

    while (cont < cantidad) {
      const key = ymd(actual);
      let estado = "✅ Hábil judicial";
      let razon = "";

      const isCierre = FECHAS_CIERRE.has(key);
      const isWE = actual.getDay() === 0 || actual.getDay() === 6;
      const isFest = festivos.has(key);

      if (isCierre) {
        estado = "❌ No cuenta";
        const ref = RESOLUCION_POR_FECHA.get(key) || "Suspensión (sin resolución registrada)";
        razon = `Suspensión - ${ref}`;
        hits.push({ fecha: key, resolucion: ref });
      } else if (isWE) {
        estado = "❌ No cuenta";
        razon = "Fin de semana";
      } else if (isFest) {
        estado = "❌ No cuenta";
        razon = "Festivo";
      } else {
        cont++;
      }

      logs.push(`${diasSemana[actual.getDay()]} ${fmt(actual)} → ${estado}${razon ? ` (${razon})` : ""}`);
      actual.setDate(actual.getDate() + 1);
    }

    const fechaFinal = new Date(actual);
    fechaFinal.setDate(fechaFinal.getDate() - 1);

    return { fechaFinal, logs, hits };
  }

  /**
   * Suma meses conservando el último día válido del mes de destino.
   *
   * @param {Date} fecha - Fecha base.
   * @param {number} meses - Número de meses que se sumarán.
   * @returns {Date} Fecha ajustada al calendario.
   */
  function sumarMeses(fecha, meses) {
    const d = new Date(fecha);
    const y = d.getFullYear(), m = d.getMonth();
    const targetY = y + Math.floor((m + meses) / 12);
    const targetM = (m + meses) % 12;
    const lastDay = new Date(targetY, targetM + 1, 0).getDate();
    const day = Math.min(d.getDate(), lastDay);
    return new Date(targetY, targetM, day);
  }

  // =========================
  // UI: toggles
  // =========================
  function toggleModo() {
    const v = el("modo_cumpl").value;
    el("box_dias").style.display = (v === "dias") ? "" : "none";
    el("box_meses").style.display = (v === "meses") ? "" : "none";
    el("box_fijo").style.display = (v === "fijo") ? "" : "none";
  }

  function toggleCond() {
    const v = el("modo_cond").value;
    el("cond_dias").style.display = (v === "dias") ? "" : "none";
    el("cond_fijo").style.display = (v === "fijo") ? "" : "none";
  }

  el("modo_cumpl").addEventListener("change", toggleModo);
  el("modo_cond").addEventListener("change", toggleCond);

  el("sin_noticia").addEventListener("change", () => {
    el("fecha_informe").disabled = el("sin_noticia").checked;
    if (el("sin_noticia").checked) el("fecha_informe").value = "";
  });

  // =========================
  // Reset
  // =========================
  function reset() {
    el("fecha_notif").value = "";
    el("tipo_notif").selectedIndex = 0;

    el("modo_cond").value = "dias";
    toggleCond();
    el("dias_cond").value = 0;
    el("fecha_cond").value = "";
    el("fecha_cumpl_cond").value = "";
    el("acepta_ext_cond").checked = false;

    el("modo_cumpl").value = "dias";
    toggleModo();
    el("dias_cumpl").value = 15;
    el("meses_cumpl").value = 1;
    el("fecha_fija").value = "";

    el("dias_informe").value = 30;
    el("fecha_informe").value = "";
    el("sin_noticia").checked = false;
    el("fecha_informe").disabled = false;

    el("resultado").style.display = "none";
    el("detalle").style.display = "none";
    el("aviso").style.display = "none";

    const contResultado = el("resultado");
    contResultado.classList.remove("resultado-ok", "resultado-bad", "resultado-neutral");
  }

  el("btn_reset").addEventListener("click", (e) => {
    e.preventDefault();
    reset();
  });

  // =========================
  // Calculadora sencilla
  // =========================
  /**
   * Suma días hábiles para la calculadora sencilla.
   *
   * @param {Date} fechaInicio - Fecha base, excluida del conteo.
   * @param {number} dias - Días hábiles a sumar.
   * @param {Set<string>} festivos - Festivos nacionales.
   * @returns {Date} Fecha final del término.
   */
  function sumarHabilesSimple(fechaInicio, dias, festivos) {
    let d = new Date(fechaInicio);
    let cont = 0;
    while (cont < dias) {
      d.setDate(d.getDate() + 1);
      if (esHabil(d, festivos)) cont++;
    }
    return d;
  }

  el("btn_simple_calc").addEventListener("click", (e) => {
    e.preventDefault();

    const fechaStr = el("simple_fecha").value;
    const dias = Number(el("simple_dias").value || 0);

    if (!fechaStr) {
      alert("Selecciona la fecha inicial.");
      return;
    }

    const base = parseYMD(fechaStr);
    const yearStart = base.getFullYear() - 1;
    const yearEnd = base.getFullYear() + 5;
    const festivos = holidaysCOForYears(yearStart, yearEnd);

    const fechaFinal = sumarHabilesSimple(base, dias, festivos);
    el("simple_resultado").textContent = `${fmt(base)} + ${dias} día(s) hábiles → ${fmt(fechaFinal)}`;
  });

  // =========================
  // Cálculo principal
  // =========================
  function calcular(mostrarDetalle) {
    const tipo = el("tipo_notif").value;
    if (!tipo) { alert("Selecciona un medio de notificación antes de calcular."); return; }

    const notifStr = el("fecha_notif").value;
    if (!notifStr) { alert("Selecciona la fecha de notificación."); return; }

    const sinNoticia = el("sin_noticia").checked;
    const informeStr = el("fecha_informe").value;

    if (!sinNoticia && !informeStr) {
      alert('Selecciona la fecha de noticia de incumplimiento o marca "Sin noticia".');
      return;
    }

    const notif = parseYMD(notifStr);
    const yearStart = notif.getFullYear() - 1;
    const yearEnd = notif.getFullYear() + 20;
    const festivos = holidaysCOForYears(yearStart, yearEnd);

    // 👇 Acumulador de suspensiones usadas en TODO el cálculo
    const suspUsadas = new Map(); // key YYYY-MM-DD -> resolución

    const diasEjecutoria = (tipo === "Estados") ? 3 : 0;
    const rEjec = sumarDiasHabilesJudiciales(notif, diasEjecutoria, festivos);
    const fechaEjecutoria = rEjec.fechaFinal;
    const logEjec = rEjec.logs;
    for (const h of rEjec.hits) suspUsadas.set(h.fecha, h.resolucion);

    // Obligación condicional
    let baseCumpl = fechaEjecutoria, logCond = [], descriptorCond = "", hayObligacionCond = false;
    const modoCond = el("modo_cond").value;

    if (modoCond === "fijo" && !el("fecha_cond").value) {
      alert('Elegiste "Fecha fija" para la obligación condicional, pero no seleccionaste la fecha.');
      return;
    }

    if (modoCond === "dias") {
      const n = Number(el("dias_cond").value || 0);
      if (n > 0) {
        const r = sumarDiasHabilesJudiciales(fechaEjecutoria, n, festivos);
        baseCumpl = r.fechaFinal;
        logCond = r.logs;
        descriptorCond = `${n} día(s) hábil(es)`;
        hayObligacionCond = true;
        for (const h of r.hits) suspUsadas.set(h.fecha, h.resolucion);
      }
    } else if (modoCond === "fijo") {
      const tentativa = parseYMD(el("fecha_cond").value);
      const ajustada = siguienteHabil(tentativa, festivos);
      baseCumpl = ajustada;
      descriptorCond = "fecha fija";
      hayObligacionCond = true;
      logCond = [
        `Fecha fija condicional: ${fmt(tentativa)}`,
        (tentativa.getTime() !== ajustada.getTime() ? `Ajustada a hábil → ${fmt(ajustada)}` : "Cae en día hábil"),
      ];
    }

    // Verificación de cumplimiento de la obligación condicional
    const cumplimientoCondStr = el("fecha_cumpl_cond").value;
    const aceptaExtCond = el("acepta_ext_cond").checked;
    let fechaCumplCondReal = null;
    let estadoCumplCond = "";
    let condExtemporanea = false;
    let inicioCumplPrincipal = baseCumpl;
    let condExtemporaneaAplicada = false;

    if (cumplimientoCondStr) {
      fechaCumplCondReal = parseYMD(cumplimientoCondStr);

      if (!hayObligacionCond) {
        estadoCumplCond = "ℹ️ Se registró cumplimiento de obligación condicional, pero no hay plazo condicional configurado.";
      } else if (ymd(fechaCumplCondReal) <= ymd(baseCumpl)) {
        estadoCumplCond = "✅ Cumplimiento de obligación condicional en término";
        // Si cumple en término, desde esta fecha real corre el plazo principal.
        inicioCumplPrincipal = fechaCumplCondReal;
      } else {
        condExtemporanea = true;
        estadoCumplCond = "⚠️ El cumplimiento de la obligación condicional fue extemporánea";
        if (aceptaExtCond) {
          inicioCumplPrincipal = fechaCumplCondReal;
          condExtemporaneaAplicada = true;
          estadoCumplCond += " (aceptada para cálculo)";
        }
      }
    }

    // Cumplimiento
    let fechaCumpl = null, logCumpl = [];
    const modo = el("modo_cumpl").value;

    if (modo === "fijo" && !el("fecha_fija").value) {
      alert('Elegiste "Fecha fija" para el cumplimiento, pero no seleccionaste la fecha.');
      return;
    }

    if (modo === "dias") {
      const n = Number(el("dias_cumpl").value || 0);
      const r = sumarDiasHabilesJudiciales(inicioCumplPrincipal, n, festivos);
      fechaCumpl = r.fechaFinal;
      logCumpl = r.logs;
      for (const h of r.hits) suspUsadas.set(h.fecha, h.resolucion);
    } else if (modo === "meses") {
      const n = Number(el("meses_cumpl").value || 0);
      const raw = sumarMeses(inicioCumplPrincipal, n);
      fechaCumpl = siguienteHabil(raw, festivos);
      logCumpl = [
        `Base: ${fmt(inicioCumplPrincipal)} + ${n} mes(es) = ${fmt(raw)}`,
        ...(raw.getTime() !== fechaCumpl.getTime() ? [`Ajustada a hábil → ${fmt(fechaCumpl)}`] : ["Cae en día hábil"]),
      ];
    } else if (modo === "fijo") {
      const raw = parseYMD(el("fecha_fija").value);
      fechaCumpl = siguienteHabil(raw, festivos);
      logCumpl = [
        `Fecha fija: ${fmt(raw)}`,
        (raw.getTime() !== fechaCumpl.getTime() ? `Ajustada a hábil → ${fmt(fechaCumpl)}` : "Cae en día hábil"),
      ];
    }

    if (!fechaCumpl || isNaN(fechaCumpl.getTime())) {
      alert("No se pudo calcular la fecha límite de cumplimiento. Revisa los campos.");
      return;
    }

    // Límite de informe (también capta suspensiones del conteo)
    const diasInf = Number(el("dias_informe").value || 0);
    const rLim = sumarDiasHabilesJudiciales(fechaCumpl, diasInf, festivos);
    for (const h of rLim.hits) suspUsadas.set(h.fecha, h.resolucion);

    const fechaLimite = siguienteHabil(rLim.fechaFinal, festivos);
    const logsLimite = [`Base: ${fmt(fechaCumpl)} + ${diasInf} día(s) hábil(es) = ${fmt(fechaLimite)}`];

    // Aviso vs hoy
    const hoy = new Date();
    const aviso = el("aviso");
    if (ymd(hoy) <= ymd(fechaCumpl)) aviso.innerHTML = "<strong>📌 Este asunto todavía está en término de cumplir.</strong>";
    else if (ymd(hoy) <= ymd(fechaLimite)) aviso.innerHTML = "<strong>📌 Este asunto todavía está en término para informar.</strong>";
    else aviso.innerHTML = '<strong class="danger">⛔ Este asunto ya venció para cumplir e informar.</strong>';

    if (condExtemporanea) {
      aviso.innerHTML += '<br><strong class="danger">⚠️ El cumplimiento de la obligación condicional fue ⛔ extemporáneo ⛔.</strong>';
    }

    aviso.style.display = "block";

    // Noticia: estado según fecha efectiva
    let estado = "▶️ Sin noticia de incumplimiento";
    let textoEntendido = "";

    if (!sinNoticia && informeStr) {
      const informe = parseYMD(informeStr);

      let fechaEfectiva = new Date(informe);
      const caeNoHabil =
        FECHAS_CIERRE.has(ymd(fechaEfectiva)) ||
        fechaEfectiva.getDay() === 0 || fechaEfectiva.getDay() === 6 ||
        festivos.has(ymd(fechaEfectiva));

      if (caeNoHabil) {
        while (
          FECHAS_CIERRE.has(ymd(fechaEfectiva)) ||
          fechaEfectiva.getDay() === 0 || fechaEfectiva.getDay() === 6 ||
          festivos.has(ymd(fechaEfectiva))
        ) {
          fechaEfectiva.setDate(fechaEfectiva.getDate() + 1);
        }

        textoEntendido = ` (se entiende entregado el ${fmt(fechaEfectiva)})`;
        const ref = RESOLUCION_POR_FECHA.get(ymd(informe));
        if (ref) textoEntendido += ` [${ref}]`;
      }

      if (fechaEfectiva <= fechaCumpl) estado = "❌ Pretémpore (informó antes de vencer el cumplimiento)";
      else if (fechaEfectiva > fechaLimite) estado = "❌ Extemporáneo (se pasó del plazo)";
      else estado = "✅ Informe oportuno";
    }

    // =========================
    // Salida (Resultados) + Suspensiones
    // =========================
    const res = [];
    res.push(`Fecha de Notificación: ${fmt(notif)} (${tipo})`);
    res.push(`Fecha de Ejecutoria: ${fmt(fechaEjecutoria)}`);
    if (descriptorCond) res.push(`⏳ Lte. cumplimiento Obligación condicional (${descriptorCond}): ${fmt(baseCumpl)}`);
    if (cumplimientoCondStr) {
      res.push(`Fecha real cumplimiento ob. condicional: ${fmt(fechaCumplCondReal)}`);
      res.push(`📣 Estado ob. condicional: ${estadoCumplCond}`);
    }
    if (condExtemporanea) {
      res.push(`☑️ Cumplimiento extemporáneo aceptado: ${aceptaExtCond ? "Sí" : "No"}`);
      if (aceptaExtCond && condExtemporaneaAplicada) {
        res.push("📝 Nota: La fecha real extemporánea se usó como base del plazo principal.");
      }
    }
    if (hayObligacionCond) res.push(`🧭 Inicio plazo cumplimiento principal: ${fmt(inicioCumplPrincipal)}`);
    res.push(`Lte. Cumplimiento: ${fmt(fechaCumpl)}`);
    res.push(`Lte. Informe incumplimiento: ${fmt(fechaLimite)}`);
    res.push(sinNoticia ? "Noticia: (sin noticia)" : `Noticia: ${fmt(parseYMD(informeStr))}${textoEntendido}`);
    res.push(`📣 Estado noticia: ${estado}`);

    // 👇 Bloque adicional en Resultados: suspensiones consideradas
    if (suspUsadas.size > 0) {
      res.push("🧾 Suspensiones tenidas en cuenta (fecha → soporte):");
      const items = [...suspUsadas.entries()].sort(([a], [b]) => a.localeCompare(b));
      for (const [fechaKey, ref] of items) {
        // si prefieres mostrar dd-mm-yyyy: conviértelo aquí
        const d = parseYMD(fechaKey);
        res.push(`Suspensión ${fmt(d)}: ${ref}`);
      }
    } else {
      res.push("🧾 Suspensiones tenidas en cuenta: (ninguna en este cálculo)");
    }

    renderResultados(res);
    el("resultado").style.display = "block";

    const contResultado = el("resultado");
    contResultado.classList.remove("resultado-ok", "resultado-bad", "resultado-neutral");
    if (condExtemporaneaAplicada && estado.includes("oportuno")) contResultado.classList.add("resultado-ok");
    else if (condExtemporanea || estado.includes("Pretémpore") || estado.includes("Extemporáneo")) contResultado.classList.add("resultado-bad");
    else if (estado.includes("oportuno")) contResultado.classList.add("resultado-ok");
    else contResultado.classList.add("resultado-neutral");

    // Detalle (sigue funcionando igual)
    if (mostrarDetalle) {
      el("det_ejecutoria").textContent = ["Detalle: Ejecutoria", ...logEjec].join("\n");
      el("det_cond").textContent = logCond.length ? ["Detalle: Obligación condicional", ...logCond].join("\n") : "";
      el("det_cumpl").textContent = logCumpl.length ? ["Detalle: Cumplimiento", ...logCumpl].join("\n") : "";
      el("det_limite").textContent = ["Detalle: Límite de informe", ...logsLimite].join("\n");
      el("detalle").style.display = "block";
    } else {
      el("detalle").style.display = "none";
    }

    el("tipo_notif").selectedIndex = 0;
  }

  el("btn_calc").addEventListener("click", (e) => { e.preventDefault(); calcular(false); });
  el("btn_detalle").addEventListener("click", (e) => { e.preventDefault(); calcular(true); });

  toggleCond();
  toggleModo();
});
