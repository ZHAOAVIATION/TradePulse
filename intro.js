(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.animateTradePulseGate = gate => {
    if (!gate || reducedMotion) return;
    gate.classList.remove('is-returning');
    void gate.offsetWidth;
    gate.classList.add('is-returning');
    gate.addEventListener('animationend', event => {
      if (event.target === gate) gate.classList.remove('is-returning');
    }, {once:true});
  };
  const screen = document.getElementById('intro-screen');
  if (!screen) return;
  const duration = reducedMotion ? 80 : 2450;
  let timer;
  window.playTradePulseIntro = () => {
    clearTimeout(timer);
    screen.replaceChildren(...Array.from(screen.childNodes, node => node.cloneNode(true)));
    screen.hidden = false;
    screen.classList.remove('intro-leaving');
    document.body.classList.remove('intro-finished');
    return new Promise(resolve => {
      timer = window.setTimeout(() => {
        screen.classList.add('intro-leaving');
        window.setTimeout(() => {
          screen.hidden = true;
          document.body.classList.add('intro-finished');
          const gate = document.getElementById('access-gate');
          if (gate && !gate.hidden && !document.body.classList.contains('app-authorized')) {
            window.animateTradePulseGate(gate);
          }
          resolve();
        }, 520);
      }, duration);
    });
  };
  window.playTradePulseIntro();
})();
