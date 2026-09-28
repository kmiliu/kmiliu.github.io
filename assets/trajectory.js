/* Progressive enhancement: the original dated disclosures remain the no-JS version. */
(() => {
    const section = document.getElementById('academic-background');
    if (!section) return;
    const source = section.querySelector('.timeline-themes');
    const today = new Date();
    const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    const current = today.getFullYear() + today.getMonth() / 12;
    function span(date) {
        const years = date.match(/\d{4}/g)?.map(Number);
        const names = date.match(/Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*/g);
        if (!years?.length || !names?.length) return null;
        const start = years[0] + months[names[0].slice(0,3).toLowerCase()] / 12;
        const ongoing = date.includes('Present');
        const point = !date.includes(' to ');
        const end = ongoing ? Math.max(start, current + 1/12) : years.at(-1) + (months[names.at(-1).slice(0,3).toLowerCase()] + 1) / 12;
        return {start, end, ongoing, point};
    }
    const groups = [...source.querySelectorAll('.timeline-theme')].map(theme => ({
        title: theme.querySelector('.timeline-theme-title').textContent.trim(),
        entries: [...theme.querySelectorAll('.timeline-node')].map(node => {
            const date = node.querySelector('.node-date').textContent;
            return {id:node.dataset.node, title:node.querySelector('.node-title').textContent,
                institution:node.querySelector('.node-institution')?.textContent || '', date,
                summary:node.querySelector('.node-summary').textContent,
                detail:node.querySelector('.node-detail-inner'), range:span(date)};
        })
    }));
    const entries = groups.flatMap(group => group.entries);
    if (entries.some(entry => !entry.range)) return;
    const firstYear = Math.floor(Math.min(...entries.map(e => e.range.start)));
    const lastYear = Math.max(Math.ceil(current), Math.ceil(Math.max(...entries.map(e => e.range.end))));
    const extent = lastYear - firstYear;
    const position = value => Math.max(0, Math.min(100, (value - firstYear) / extent * 100));
    const make = (tag, className, text) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    };
    const explorer = make('div','trajectory');
    const map = make('div','trajectory-map');
    const top = make('div','trajectory-map-head');
    top.append(make('span','trajectory-kicker','An evolving practice'), make('span','trajectory-kicker',`${firstYear} — ${lastYear - 1}`));
    map.append(top);
    const axis = make('div','trajectory-axis');
    axis.append(make('span','trajectory-axis-label','Select an experience'));
    const years = make('div','trajectory-years');
    for(let year=firstYear;year<lastYear;year++) {
        const label=make('span','',String(year)); label.style.left=`${position(year)}%`; years.append(label);
    }
    axis.append(years); map.append(axis);
    const buttons=[];
    const panel=make('article','trajectory-detail');
    panel.id='trajectory-detail'; panel.tabIndex=0;
    const status=make('span','trajectory-sr'); status.setAttribute('role','status');
    let active=0;
    function select(index, announce=false) {
        active=index;
        const entry=entries[index];
        buttons.forEach((button,i)=>{
            button.setAttribute('aria-pressed',String(i===index));
        });
        panel.replaceChildren();
        const meta=make('div','trajectory-detail-meta');
        meta.append(make('span','trajectory-kicker','Experience / '+String(index+1).padStart(2,'0')),make('span','trajectory-kicker',`${index+1} / ${entries.length}`));
        const year=make('div','trajectory-selected-year',String(Math.floor(entry.range.start)));
        year.setAttribute('aria-hidden','true');
        const date=make('p','trajectory-date',entry.date);
        if(entry.range.start>current) date.append(' · Expected');
        else if(entry.range.end>current && !entry.range.ongoing) date.append(' · Expected completion');
        const title=make('h4','trajectory-title',entry.title); title.id='trajectory-title';
        panel.setAttribute('aria-labelledby',title.id);
        const copy=make('div','trajectory-copy');
        copy.append(...[...entry.detail.childNodes].map(node=>node.cloneNode(true)));
        panel.append(meta,year,date,title);
        const back=make('button','trajectory-map-return','Back to time map ↑');back.type='button';
        back.addEventListener('click',()=>{
            buttons[active].scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
            buttons[active].focus({preventScroll:true});
        });
        meta.after(back);
        if(entry.institution)panel.append(make('p','trajectory-institution',entry.institution));
        const disclosure=make('details','trajectory-full');
        const disclosureTitle=make('summary','','Experience details');
        disclosure.append(disclosureTitle,copy);
        panel.append(make('p','trajectory-summary',entry.summary),disclosure);
        const projects = {'16':'salk','11':'creativity','10':'vta-pfc','14':'covid','7':'capsaicin','12':'p53'};
        if (projects[entry.id] && typeof openProjectModal === 'function') {
            const related=make('button','trajectory-related','Explore the research ↗');related.type='button';
            related.addEventListener('click',()=>openProjectModal(projects[entry.id],related));
            panel.append(related);
        }
        const controls=make('div','trajectory-controls');
        const prev=make('button','','← Previous');prev.type='button';prev.disabled=index===0;
        const next=make('button','','Next →');next.type='button';next.disabled=index===entries.length-1;
        prev.addEventListener('click',()=>{select(active-1,true); panel.querySelector('.trajectory-controls button:not(:disabled)')?.focus({preventScroll:true});});
        next.addEventListener('click',()=>{select(active+1,true); (panel.querySelector('.trajectory-controls button:last-child:not(:disabled)') || panel.querySelector('.trajectory-controls button:not(:disabled)'))?.focus({preventScroll:true});});
        controls.append(prev,next);panel.append(controls);
        if(announce)status.textContent=`${entry.title}. ${entry.date}. Experience ${index+1} of ${entries.length}.`;
    }
    groups.forEach((group,groupIndex)=>{
        const heading=make('h4','trajectory-group-title',group.title);
        heading.id=`trajectory-group-${groupIndex}`;
        map.append(heading);
        const list=make('div','trajectory-group');list.setAttribute('role','group');list.setAttribute('aria-labelledby',heading.id);
        group.entries.forEach(entry=>{
            const index=entries.indexOf(entry);
            const button=make('button','trajectory-entry');button.type='button';
            button.setAttribute('aria-controls',panel.id);
            button.setAttribute('aria-label',`${entry.title}${entry.institution ? ', '+entry.institution : ''}. ${entry.date}`);
            const label=make('span','trajectory-entry-label');
            label.append(make('strong','',entry.title));
            if(entry.institution) label.append(make('span','',entry.institution));
            label.append(make('span','trajectory-entry-date',entry.date));
            const track=make('span','trajectory-track');track.setAttribute('aria-hidden','true');
            track.style.setProperty('--year-step',`${100/extent}%`);
            const bar=make('span','trajectory-bar');
            const left=position(entry.range.start),right=position(entry.range.end);
            bar.style.left=`${left}%`;bar.style.width=`${Math.max(right-left,1.2)}%`;
            if(entry.range.point)bar.classList.add('is-point');
            if(entry.range.ongoing)bar.classList.add('is-ongoing');
            if(entry.range.end>current && !entry.range.ongoing) {
                bar.classList.add('is-planned');
                bar.style.setProperty('--completed',`${Math.max(0,Math.min(100,(current-entry.range.start)/(entry.range.end-entry.range.start)*100))}%`);
            }
            const now=make('span','trajectory-now');now.style.left=`${position(current)}%`;
            track.append(now,bar);button.append(label,track);
            button.addEventListener('click',()=>{
                select(index,true);
                if(window.matchMedia('(max-width: 760px)').matches) {
                    panel.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
                    panel.focus({preventScroll:true});
                }
            });
            button.addEventListener('keydown',event=>{
                let next;
                if(event.key==='ArrowDown')next=Math.min(index+1,entries.length-1);
                if(event.key==='ArrowUp')next=Math.max(index-1,0);
                if(event.key==='Home')next=0;
                if(event.key==='End')next=entries.length-1;
                if(next===undefined)return;
                event.preventDefault();select(next,true);buttons[next].focus({preventScroll:true});
            });
            buttons.push(button);list.append(button);
        });
        map.append(list);
    });
    const legend=make('p','trajectory-legend','Solid: completed period · Hatched: planned period · Open end: ongoing');
    map.append(legend,make('p','trajectory-map-note','Dates shown by month. The fine copper line marks the current month.'));
    const reading=make('div','trajectory-reading');reading.append(panel);
    explorer.append(map,reading,status);
    select(0);
    source.before(explorer);
    source.hidden=true;
    section.classList.add('has-trajectory');
    const fit = () => reading.classList.toggle('is-tall',panel.getBoundingClientRect().height > window.innerHeight - 120);
    new ResizeObserver(fit).observe(panel);
    window.addEventListener('resize',fit,{passive:true});
    fit();
})();
