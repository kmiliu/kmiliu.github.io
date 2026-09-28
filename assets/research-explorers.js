/* These controls explain experimental choices. They never calculate policy outputs. */
(() => {
    const rat = document.querySelector('.rat-explorer');
    if (rat) {
        const gap = rat.querySelector('#rat-gap');
        const noise = rat.querySelector('#rat-noise');
        const cleanCanvas = rat.querySelector('#rat-clean-image');
        const noisyCanvas = rat.querySelector('#rat-noisy-image');
        const clean = cleanCanvas.getContext('2d', { willReadFrequently: true });
        const noisy = noisyCanvas.getContext('2d');
        const width = cleanCanvas.width;
        const height = cleanCanvas.height;
        const names = ['None', 'Low', 'Medium', 'High'];
        // Demonstration-only standard deviations in an 8-bit image; NOT study parameters.
        const demoSigma = [0, 18, 42, 80];
        const field = new Float32Array(width * height * 3);
        let seed = 94721;
        const uniform = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return (seed + 0.5) / 4294967296;
        };
        // Box–Muller samples N(0,1). Reuse one field so strength is the only noise change.
        for (let i = 0; i < field.length; i += 2) {
            const radius = Math.sqrt(-2 * Math.log(uniform()));
            const angle = 2 * Math.PI * uniform();
            field[i] = radius * Math.cos(angle);
            if (i + 1 < field.length) field[i + 1] = radius * Math.sin(angle);
        }
        function polygon(points, fill) {
            clean.beginPath();
            points.forEach(([x, y], i) => i ? clean.lineTo(x, y) : clean.moveTo(x, y));
            clean.closePath();
            clean.fillStyle = fill;
            clean.fill();
        }
        function drawScene(gapWidth) {
            const sky = clean.createLinearGradient(0, 0, 0, height);
            sky.addColorStop(0, '#cbd6d0');
            sky.addColorStop(1, '#f1eddb');
            clean.fillStyle = sky;
            clean.fillRect(0, 0, width, height);
            clean.fillStyle = '#89977f';
            clean.fillRect(0, 182, width, 18);
            // A generic side-view scene, not an experimental camera frame or calibrated geometry.
            const farEdge = 130 + gapWidth * 3;
            clean.fillStyle = '#536e59';
            clean.fillRect(0, 118, 130, 82);
            clean.fillRect(farEdge, 118, width - farEdge, 82);
            polygon([[0, 118], [35, 91], [160, 91], [130, 118]], '#a8b894');
            polygon([[farEdge, 118], [farEdge + 30, 91], [360, 91], [360, 118]], '#a8b894');
            clean.strokeStyle = '#e1e6ce';
            clean.lineWidth = 2;
            clean.beginPath();
            clean.moveTo(0, 118); clean.lineTo(130, 118);
            clean.moveTo(farEdge, 118); clean.lineTo(360, 118);
            clean.stroke();
            clean.strokeStyle = '#799076';
            clean.lineWidth = 1;
            for (let x = 10; x < width; x += 18) {
                if (x > 130 && x < farEdge) continue;
                clean.beginPath(); clean.moveTo(x, 127); clean.lineTo(x, 196); clean.stroke();
            }
        }
        function render() {
            const gapWidth = Number(gap.value);
            const level = Number(noise.value);
            rat.querySelector('#rat-gap-output').value = `${gapWidth} cm`;
            rat.querySelector('#rat-noise-output').value = names[level];
            gap.setAttribute('aria-valuetext', `${gapWidth} centimeters`);
            noise.setAttribute('aria-valuetext', `${names[level]} illustrative Gaussian noise`);
            cleanCanvas.setAttribute('aria-label', `Clean synthetic scene for a ${gapWidth} centimeter gap; not an experimental camera frame`);
            noisyCanvas.setAttribute('aria-label', `The same synthetic scene with ${names[level].toLowerCase()} illustrative Gaussian noise; no behavioral outcome is shown`);
            drawScene(gapWidth);
            const base = clean.getImageData(0, 0, width, height);
            const result = noisy.createImageData(width, height);
            const sigma = demoSigma[level];
            for (let pixel = 0; pixel < width * height; pixel++) {
                for (let channel = 0; channel < 3; channel++) {
                    // Uint8ClampedArray clips the perturbed values to the display range [0,255].
                    result.data[pixel * 4 + channel] =
                        base.data[pixel * 4 + channel] + sigma * field[pixel * 3 + channel];
                }
                result.data[pixel * 4 + 3] = 255;
            }
            noisy.putImageData(result, 0, 0);
        }
        if (clean && noisy) {
            gap.addEventListener('input', render);
            noise.addEventListener('input', render);
            rat.querySelector('#rat-reset').addEventListener('click', () => {
                gap.value = '20';
                noise.value = '2';
                render();
            });
            render();
        } else {
            gap.disabled = true;
            noise.disabled = true;
            rat.querySelector('#rat-reset').disabled = true;
            rat.querySelector('#rat-condition-limit').textContent =
                'The image preview is unavailable in this browser. In the experiment, Gaussian noise was added to visual observations; the input was not removed by this manipulation.';
        }
    }

    const booleanDemo = document.querySelector('.boolean-explorer');
    if (booleanDemo) {
        const seed = [1, 0, 0];
        const buttons = [...booleanDemo.querySelectorAll('[data-seed]')];
        function renderCycle() {
            const timeline = booleanDemo.querySelector('.boolean-timeline');
            timeline.replaceChildren();
            const rowLabels = document.createElement('div');
            rowLabels.className = 'boolean-row-labels';
            ['', 'A', 'B', 'C'].forEach(text => {
                const label = document.createElement('span');
                label.textContent = text;
                rowLabels.append(label);
            });
            timeline.append(rowLabels);
            let state = [...seed];
            const states = [];
            for (let step = 0; step < 7; step++) {
                states.push(state.join(''));
                const column = document.createElement('div');
                const label = document.createElement('span');
                label.textContent = `t${step}`;
                column.append(label);
                state.forEach((bit, index) => {
                    const cell = document.createElement('span');
                    cell.className = `boolean-bit${bit ? ' is-on' : ''}`;
                    cell.textContent = bit;
                    cell.title = `${'ABC'[index]} at step ${step}: ${bit}`;
                    column.append(cell);
                });
                timeline.append(column);
                state = [state[2], state[0], state[1]];
            }
            buttons.forEach((button, i) => {
                button.setAttribute('aria-pressed', String(Boolean(seed[i])));
                button.querySelector('span').textContent = seed[i];
            });
            timeline.setAttribute('aria-label', `Rows are A, B, C. States at steps zero through six: ${states.join(', ')}.`);
            const period = states.slice(1).indexOf(states[0]) + 1;
            booleanDemo.querySelector('.boolean-status').textContent = period === 1
                ? `${states[0]} stays unchanged: a fixed point.`
                : `${states.slice(0, period + 1).join(' → ')}. The starting state returns after ${period} steps.`;
        }
        buttons.forEach((button, index) => button.addEventListener('click', () => {
            seed[index] = 1 - seed[index];
            renderCycle();
        }));
        renderCycle();
    }

    const tabs = [...document.querySelectorAll('.metric-tabs [role="tab"]')];
    function selectTab(selected) {
        tabs.forEach(tab => {
            const active = tab === selected;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
        });
    }
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectTab(tab));
        tab.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            selectTab(tabs[next]);
            tabs[next].focus();
        });
    });
})();
