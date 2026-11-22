/* Exercices originaux ; aucun résultat ni donnée n’est enregistré. */
(function () {
  'use strict';

  const exercises = {
    1: [[406, 7], [507, 8], [260, 4], [380, 6], [124, 2]],
    2: [[307, 24], [305, 20], [408, 36], [420, 19], [276, 82], [900, 10]]
  };
  const digitCount = n => String(n).length;
  const columnsOf = n => Array.from(String(n), Number).reverse();

  function partial(a, digit, shift) {
    const carries = [];
    let carry = 0;
    const source = columnsOf(a);
    source.forEach((value, col) => {
      carry = Math.floor((value * digit + carry) / 10);
      // A last carry is already the leading digit of this product.
      if (col < source.length - 1) carries[col + 1] = carry;
    });
    const digits = columnsOf(a * digit);
    return { digits, carries, shift };
  }

  function makeProblem(a, b) {
    const width = digitCount(a) + digitCount(b);
    const rows = columnsOf(b).map((d, i) => partial(a, d, i));
    const result = columnsOf(a * b);
    const additionCarries = [];
    if (rows.length > 1) {
      let carry = 0;
      for (let col = 0; col < result.length - 1; col++) {
        carry = Math.floor((rows.reduce((sum, row) => sum + (row.digits[col - row.shift] ?? 0), carry)) / 10);
        additionCarries[col + 1] = carry;
      }
    }
    return { a, b, width, rows, result, additionCarries };
  }

  function start(root, focusHeading) {
    let level = 1;
    const positions = { 1: 0, 2: 0 };

    function render() {
      const [a, b] = exercises[level][positions[level]];
      const problem = makeProblem(a, b);
      const colHeaders = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de milliers'];
      const stepLabels = ['Retenues × unités', 'Produit × unités', 'Retenues × dizaines', 'Produit × dizaines', 'Retenues de l’addition', 'Résultat'];
      const fields = [];
      const row = (label, getCell, divider = false) => {
        const cells = [];
        for (let col = problem.width - 1; col >= 0; col--) cells.push('<td>' + getCell(col) + '</td>');
        return '<tr' + (divider ? ' class="multi-rule"' : '') + '><th scope="row">' + label + '</th>' + cells.join('') + '</tr>';
      };
      const input = (step, col, digit, carry = false) => {
        const id = 'multi-' + step + '-' + col;
        fields.push({ id, step, col, digit, carry });
        return '<input id="' + id + '" aria-label="' + stepLabels[step] + ', colonne des ' +
          colHeaders[col] + '" inputmode="numeric" maxlength="1" autocomplete="off" pattern="[0-9]">';
      };
      const operand = n => col => columnsOf(n)[col] ?? '';
      let grid = row('Nombre', operand(a)) + row('× Multiplicateur', operand(b));
      problem.rows.forEach((p, i) => {
        grid += row(stepLabels[i * 2], col => {
          const local = col - p.shift;
          return p.carries[local] === undefined ? '' : input(i * 2, col, p.carries[local], true);
        }, i === 0);
        if (level === 2) {
          grid += row(stepLabels[i * 2 + 1], col => {
            if (col < p.shift) return input(i * 2 + 1, col, 0);
            const value = p.digits[col - p.shift];
            return value === undefined ? '' : input(i * 2 + 1, col, value);
          });
        }
      });
      if (level === 2) {
        grid += row(stepLabels[4], col => problem.additionCarries[col] === undefined
          ? '' : input(4, col, problem.additionCarries[col], true), true);
      }
      grid += row(stepLabels[5], col => problem.result[col] === undefined ? '' : input(5, col, problem.result[col]), true);
      root.dataset.quizId = 'multiplications-posees';
      root.innerHTML = '<div class="eyebrow">Mathématiques · Calcul</div><h1 tabindex="-1">Multiplications posées</h1>' +
        '<p class="intro">Commence à droite. Écris chaque retenue dans la colonne où tu la reportes. Laisse la case vide s’il n’y a pas de retenue.</p>' +
        '<div class="multi-levels" role="group" aria-label="Niveau">' +
        '<button type="button" data-multi-level="1" aria-pressed="' + (level === 1) + '">× 1 chiffre</button>' +
        '<button type="button" data-multi-level="2" aria-pressed="' + (level === 2) + '">× 2 chiffres</button></div>' +
        (level === 2 ? '<p class="note">Calcule les deux produits, puis additionne-les. La ligne des dizaines est décalée d’une colonne : écris 0 dans sa case des unités.</p>' : '') +
        '<form id="multi-form" novalidate><table class="multi-grid" aria-label="' + a + ' multiplié par ' + b +
        '"><tbody>' + grid + '</tbody></table><button class="primary" type="submit">Vérifier mon calcul</button>' +
        '<p id="multi-feedback" aria-live="polite" class="note"></p></form>' +
        '<button type="button" id="multi-next" class="secondary">Autre multiplication →</button>' +
        '<p class="note">Entraînement : les réponses ne sont pas enregistrées.</p>';

      root.querySelectorAll('[data-multi-level]').forEach(button => button.addEventListener('click', () => {
        const next = Number(button.dataset.multiLevel);
        if (next !== level) { level = next; render(); }
      }));
      root.querySelector('#multi-next').addEventListener('click', () => {
        positions[level] = (positions[level] + 1) % exercises[level].length;
        render();
      });
      root.querySelectorAll('.multi-grid input').forEach(box => box.addEventListener('input', () => {
        box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
        box.removeAttribute('aria-invalid');
      }));
      root.querySelector('#multi-form').addEventListener('submit', event => {
        event.preventDefault();
        const feedback = root.querySelector('#multi-feedback');
        const rowPriority = level === 1 ? [0, 5] : [0, 1, 2, 3, 4, 5];
        const ordered = [...fields].sort((x, y) => rowPriority.indexOf(x.step) - rowPriority.indexOf(y.step) || x.col - y.col);
        let firstError;
        ordered.forEach(field => {
          const element = root.querySelector('#' + field.id);
          element.removeAttribute('aria-invalid');
          const correct = field.carry && field.digit === 0 && element.value === '' || element.value === String(field.digit);
          if (!correct && !firstError) firstError = { ...field, element };
        });
        if (!firstError) {
          feedback.textContent = 'Tout est juste : ' + a + ' × ' + b + ' = ' + (a * b) + '.';
          return;
        }
        const f = firstError;
        const stage = f.step === 3 && f.col === 0 ? 'décalage du produit des dizaines' : f.step === 5 && level === 2 ? 'addition des deux produits' : f.step === 5 ? 'résultat' : stepLabels[f.step].toLowerCase();
        feedback.textContent = 'À reprendre : ' + stage + ', colonne des ' + colHeaders[f.col] +
          (f.element.value === '' ? '. Complète cette case.' : '. Vérifie le calcul dans cette colonne.');
        f.element.setAttribute('aria-invalid', 'true');
        f.element.focus();
      });
      focusHeading();
    }
    render();
  }

  window.MultiplicationsPosees = Object.freeze({ start });
}());
