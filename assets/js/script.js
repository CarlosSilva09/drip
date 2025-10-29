// Registrar plugins do GSAP (protegido caso algum CDN falhe)
try {
    gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin, ScrollToPlugin, Observer, Flip, Draggable, SplitText);
} catch (e) {
    console.warn('GSAP plugins não registrados:', e);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('GSAP Loaded:', typeof gsap !== 'undefined');
    
    // ====================================
    // Hero Section Animations - NOVA ESTRUTURA
    // ====================================
    // Entrada minimalista: sutileza, sem rotações ou bounces
    const tlHeroIn = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tlHeroIn
        .from('.hero-main-content', { autoAlpha: 0, duration: 0.8 }, 0)
        .from('.hero-text-section', { y: 24, autoAlpha: 0, duration: 0.6 }, 0.1)
        .from('.hero-logo-small', { autoAlpha: 0, y: 14, duration: 0.5 }, 0.3)
        .from('.hero-yellow-circle', { autoAlpha: 0, scale: 0.94, duration: 0.5 }, 0.35);

    // Animação suave para o título principal (SplitText)
    const heroTitle = document.querySelector('.hero-title');
    let heroTitleSplit = null;
    const initHeroTitleHover = (chars) => {
        if (!heroTitle || heroTitle.dataset.hoverInit === 'true') return;
        const charsArray = Array.isArray(chars) ? chars : Array.from(chars || []);
        if (!charsArray.length) return;

        const hoverIn = () => {
            gsap.to(charsArray, {
                duration: 0.4,
                ease: 'power2.out',
                stagger: { each: 0.006, from: 'random' },
            });
        };
        const hoverOut = () => {
            gsap.to(charsArray, {
                duration: 0.5,
                ease: 'power3.out',
                stagger: { each: 0.004 },
                x: 0,
                y: 0,
                rotation: 0
            });
        };
        heroTitle.addEventListener('mouseenter', hoverIn);
        heroTitle.addEventListener('mouseleave', hoverOut);
        // acessibilidade: foco com teclado também ativa
        heroTitle.addEventListener('focusin', hoverIn);
        heroTitle.addEventListener('focusout', hoverOut);
        heroTitle.dataset.hoverInit = 'true';
    };

    const createHeroTitleAnimation = () => {
        if (!heroTitle) return null;
        if (typeof SplitText === 'undefined') {
            // fallback: mantém hover básico sem animação de entrada
            initHeroTitleHover(heroTitle.querySelectorAll('span'));
            return null;
        }
        heroTitleSplit = new SplitText(heroTitle, {
            type: 'lines,words,chars',
            charsClass: 'char',
            wordsClass: 'hero-word',
            linesClass: 'hero-line'
        });

        if (heroTitleSplit.lines && heroTitleSplit.lines.length) {
            gsap.set(heroTitleSplit.lines, { overflow: 'hidden', paddingBottom: '0.05em' });
        }

        const chars = heroTitleSplit.chars;
        if (!chars || !chars.length) return null;

        const tl = gsap.timeline({
            paused: true,
            defaults: { ease: 'power2.out' },
            onComplete: () => initHeroTitleHover(chars)
        });

        tl.from(chars, {
            yPercent: 45,
            autoAlpha: 0,
            duration: 0.58,
            ease: 'power3.out',
            transformOrigin: '50% 100%',
            stagger: {
                each: 0.024,
                from: 'start'
            }
        }, 0);

        return tl;
    };

    const heroTitleIntroTl = createHeroTitleAnimation();
    if (heroTitleIntroTl) {
        tlHeroIn.add(() => heroTitleIntroTl.restart(true), 0.18);
    }

    // Capa do vídeo no smartphone (troca para o iframe apenas ao clicar)
    (function initHeroVideoCover() {
        const phoneScreen = document.querySelector('.hero-phone-screen');
        if (!phoneScreen) return;
        const coverButton = phoneScreen.querySelector('.hero-video-cover');
        const iframe = phoneScreen.querySelector('iframe');
        if (!iframe || !coverButton) return;

        const videoSrc = iframe.dataset.videoSrc;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('tabindex', '-1');

        const activateVideo = () => {
            if (!phoneScreen.classList.contains('hero-phone-screen--playing')) {
                if (videoSrc) {
                    iframe.src = videoSrc;
                }
                iframe.removeAttribute('aria-hidden');
                iframe.removeAttribute('tabindex');
                phoneScreen.classList.add('hero-phone-screen--playing');
            }
        };

        coverButton.addEventListener('click', activateVideo);
    })();

    // Lupa (ícone dentro da ampola) girando no centro
    gsap.to('.hero-yellow-circle img', {
        rotation: 360,
        transformOrigin: '50% 50%',
        ease: 'linear',
        duration: 6,
        repeat: -1
    });

    // Telefone - entrada suave e flutuação sincronizada com o grid
    let phoneFloatTween = null;
    let gridTween = null;
    const getAmp = () => {
        const root = document.querySelector('.hero-section');
        const cssVal = getComputedStyle(root).getPropertyValue('--hero-grid-h');
        const gridH = parseFloat(cssVal) || 60; // fallback
        return gridH / 3;
    };
    const startPhoneFloat = () => {
        const target = document.querySelector('.hero-phone');
        if (!target) return;
        const amp = getAmp(); // amplitude reduzida para manter o movimento sutil
        const floatDuration = 4; // mantém sensação original
        if (phoneFloatTween) phoneFloatTween.kill();
        // Parte do topo (já inicia em -amp), vai até a borda inferior (+amp) e volta
        phoneFloatTween = gsap.to(target, {
            y: amp,
            duration: floatDuration,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

            // Sincroniza o “neon” (grid) para também ir até o fim na mesma cadência
            const gridEl = document.querySelector('.hero-transition-grid');
            if (gridEl) {
                if (gridTween) gridTween.kill();
                gsap.set(gridEl, { backgroundPosition: '0px 0' });
                gridTween = gsap.to(gridEl, {
                    backgroundPosition: '160px 0',
                    duration: floatDuration,
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true
                });
            }
    };

    // Define a posição inicial no topo da faixa ANTES da animação de entrada
    gsap.set('.hero-phone', { y: -getAmp() });
    const phoneEnter = gsap.from('.hero-phone', {
        opacity: 0,
        x: 200,
        scale: 1.03,
        duration: 2,
        delay: 0.7,
        ease: 'power3.out',
        onComplete: () => startPhoneFloat()
    });
    // Recalcula amplitude em resize para cobrir todo o grid
    window.addEventListener('resize', () => {
        if (document.querySelector('.hero-phone')) {
            startPhoneFloat();
        }
    });

    // Grid de transição: reveal + efeito de “reflexo” sutil em loop
    const grid = document.querySelector('.hero-transition-grid');
    if (grid) {
    gsap.from(grid, { autoAlpha: 0, y: 40, duration: 0.9, ease: 'power2.out', delay: 0.6 });
    // o shimmer agora é sincronizado com a flutuação do telefone (ver startPhoneFloat)
    }

    // Glow sobre o grid em perspectiva (fundo roxo): varre da esquerda para a direita
    const gridGlow = document.querySelector('.hero-grid-glow');
    if (gridGlow) {
        // começa fora da esquerda e atravessa
        gsap.set(gridGlow, { xPercent: -30 });
        gsap.to(gridGlow, {
            xPercent: 130,
            duration: 6,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });
    }

    // Animações no próprio SVG oficial (fundo-hero.svg) carregado no <object>
    const floorObj = document.querySelector('.hero-floor-svg');
    if (floorObj) {
        floorObj.addEventListener('load', () => {
            const svgDoc = floorObj.contentDocument;
            if (!svgDoc) return;
            const svgEl = svgDoc.querySelector('svg');
            if (!svgEl) return;

            // Se o SVG veio como imagem dentro de pattern, criamos um overlay de scan com <rect>
            // Adiciona defs + gradient e um rect que atravessa
            const defs = svgDoc.querySelector('defs') || svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!defs.parentNode) svgEl.appendChild(defs);

            const gradId = 'scanGradient';
            let grad = svgDoc.getElementById(gradId);
            if (!grad) {
                grad = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                grad.setAttribute('id', gradId);
                grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','1'); grad.setAttribute('y2','0');
                const a = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop'); a.setAttribute('offset','0%'); a.setAttribute('stop-color','#FEE644'); a.setAttribute('stop-opacity','0');
                const b = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop'); b.setAttribute('offset','50%'); b.setAttribute('stop-color','#FEE644'); b.setAttribute('stop-opacity','0.35');
                const c = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop'); c.setAttribute('offset','100%'); c.setAttribute('stop-color','#FEE644'); c.setAttribute('stop-opacity','0');
                grad.appendChild(a); grad.appendChild(b); grad.appendChild(c);
                defs.appendChild(grad);
            }

            let scan = svgDoc.getElementById('gh-scan');
            if (!scan) {
                scan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                scan.setAttribute('id','gh-scan');
                scan.setAttribute('x','0');
                scan.setAttribute('y','0');
                scan.setAttribute('width', svgEl.getAttribute('width') || '1440');
                scan.setAttribute('height', svgEl.getAttribute('height') || '101');
                scan.setAttribute('fill',`url(#${gradId})`);
                scan.setAttribute('opacity','0.0');
                svgEl.appendChild(scan);
            }

            // Anima: varre da esquerda para a direita e volta
            gsap.set(scan, { x: -200, opacity: 0.0 });
            gsap.to(scan, { x: 200, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, opacity: 1 });
        });
    }

// ====================================
// RD Partner Section Entrance Animation
// ====================================
  (function initRdPartnerAnimation() {
    const section = document.querySelector(".rd-partner-section");
    if (!section) return;

    const image = section.querySelector(".rd-partner-image");
    const photo = image ? image.querySelector("img") : null;
    const badge = section.querySelector(".rd-partner-badge");
    const logos = section.querySelector(".rd-partner-logos");
    const title = section.querySelector(".rd-partner-title");
    const paragraphs = section.querySelectorAll(".rd-partner-info p");
    const cta = section.querySelector(".rd-partner-cta");

    const tl = gsap.timeline({
      paused: true,
      defaults: { duration: 0.6, ease: "power2.out" },
    });

    tl.from(image, { x: -32, autoAlpha: 0 })
      .from(badge, { scale: 0.6, autoAlpha: 0, ease: "back.out(1.5)" }, "-=0.3")
      .from(logos, { y: 24, autoAlpha: 0 }, "-=0.25")
      .from(title, { y: 16, autoAlpha: 0 }, "-=0.25")
      .from(paragraphs, { y: 20, autoAlpha: 0, stagger: 0.1 }, "-=0.2");

    if (cta) {
      tl.from(cta, { y: 24, autoAlpha: 0 }, "-=0.15");
    }

    const floatTweens = [
      photo
        ? gsap.to(photo, {
            y: "+=10",
            duration: 5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            paused: true,
          })
        : null,
    ].filter(Boolean);

    const pauseFloat = () => {
      floatTweens.forEach((tween) => tween.pause());
    };

    tl.eventCallback("onComplete", () =>
      floatTweens.forEach((tween) => tween.play())
    );

    const playTimeline = () => {
      pauseFloat();
      tl.restart();
    };

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        onEnter: playTimeline,
        onEnterBack: playTimeline,
        onLeave: pauseFloat,
        onLeaveBack: pauseFloat,
      });
    } else {
      playTimeline();
    }
  })();

    // ====================================
    // Footer Section - Logo Dinâmico (LEGADO, protegido)
    // ====================================
    const footerLogo = document.querySelector('.footer-logo-dynamic');
    if (footerLogo) {
        gsap.timeline({
            scrollTrigger: {
                trigger: '.hero-section', start: 'top center', end: 'bottom center',
                onEnter: () => footerLogo.className = 'footer-logo-dynamic hero-active',
                onLeave: () => footerLogo.className = 'footer-logo-dynamic',
                onEnterBack: () => footerLogo.className = 'footer-logo-dynamic hero-active',
                onLeaveBack: () => footerLogo.className = 'footer-logo-dynamic'
            }
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: '.numbers-section', start: 'top center', end: 'bottom center',
                onEnter: () => footerLogo.className = 'footer-logo-dynamic numbers-active',
                onLeave: () => footerLogo.className = 'footer-logo-dynamic',
                onEnterBack: () => footerLogo.className = 'footer-logo-dynamic numbers-active',
                onLeaveBack: () => footerLogo.className = 'footer-logo-dynamic'
            }
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: '.about-section', start: 'top center', end: 'bottom center',
                onEnter: () => footerLogo.className = 'footer-logo-dynamic about-active',
                onLeave: () => footerLogo.className = 'footer-logo-dynamic',
                onEnterBack: () => footerLogo.className = 'footer-logo-dynamic about-active',
                onLeaveBack: () => footerLogo.className = 'footer-logo-dynamic'
            }
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: '.services-section', start: 'top center', end: 'bottom center',
                onEnter: () => footerLogo.className = 'footer-logo-dynamic services-active',
                onLeave: () => footerLogo.className = 'footer-logo-dynamic',
                onEnterBack: () => footerLogo.className = 'footer-logo-dynamic services-active',
                onLeaveBack: () => footerLogo.className = 'footer-logo-dynamic'
            }
        });
    }

    // Animações do conteúdo do footer
    if (document.querySelector('.footer-title')) gsap.from('.footer-title', {
        scrollTrigger: {
            trigger: '.footer-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 100,
        duration: 1.2,
        ease: 'power3.out'
    });

    if (document.querySelector('.footer-address')) gsap.from('.footer-address', {
        scrollTrigger: {
            trigger: '.footer-section',
            start: 'top 60%',
            toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.3,
        ease: 'power2.out'
    });

    if (document.querySelector('.footer-room')) gsap.from('.footer-room', {
        scrollTrigger: {
            trigger: '.footer-section',
            start: 'top 50%',
            toggleActions: 'play none none reverse'
        },
        opacity: 0,
        scale: 0.5,
        duration: 1.5,
        delay: 0.6,
        ease: 'back.out(1.2)'
    });

    // ====================================
    // Button Hover Effects
    // ====================================
    
    document.querySelectorAll('.btn-outline, .btn-primary').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                scale: 1.05,
                y: -3,
                duration: 0.3,
                ease: 'back.out(1.7)'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                scale: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // ====================================
    // Parallax Effects
    // ====================================
    
    // Hero image parallax
    if (document.querySelector('.hero-image')) gsap.to('.hero-image', {
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: 100,
        ease: 'none'
    });

    // Background parallax for numbers section (usa .numbers-background img no HTML)
    if (document.querySelector('.numbers-background img')) gsap.to('.numbers-background img', {
        scrollTrigger: {
            trigger: '.numbers-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        y: -50,
        ease: 'none'
    });

    // Footer background parallax
    if (document.querySelector('.footer-bg img')) gsap.to('.footer-bg img', {
        scrollTrigger: {
            trigger: '.footer-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        y: -80,
        ease: 'none'
    });


    // ====================================
    // Footer Panels - transição de cores com pin
    // ====================================
    const footerPanelsPin = document.querySelector('.footer-panels-pin');
    if (footerPanelsPin) {
        // Garante que as classes de tema mapeiem para os estilos existentes
        footerPanelsPin.classList.add('footer-panels');
        const themes = [
            {
                name: 'theme-teal',
                color: '#0CB3AC',
                logoVars: { frame: 0.26, image: 0.95, shadow: 0.24 }
            },
            {
                name: 'theme-red',
                color: '#DC473B',
                logoVars: { frame: 0.23, image: 0.93, shadow: 0.22 }
            },
            {
                name: 'theme-yellow',
                color: '#FEE644',
                logoVars: { frame: 0.16, image: 0.9, shadow: 0.12 }
            }
        ];

        const themeClasses = themes.map(theme => theme.name);

        const applyTheme = (theme) => {
            footerPanelsPin.classList.remove(...themeClasses);
            footerPanelsPin.classList.add(theme.name);
        };

        const cycleThemes = [...themes, themes[0]]; // duplicate first to close the loop
        const tlFooter = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: '.footer-panels-section',
                start: 'top top',
                end: () => '+=' + (cycleThemes.length - 1) * window.innerHeight,
                scrub: true,
                pin: '.footer-panels-pin',
                anticipatePin: 1,
                snap: {
                    snapTo: (value) => {
                        const step = 1 / (cycleThemes.length - 1);
                        return Math.round(value / step) * step;
                    },
                    duration: 0.35,
                    ease: 'power1.inOut'
                }
            }
        });

        gsap.set(footerPanelsPin, {
            backgroundColor: cycleThemes[0].color,
            '--frame-opacity': cycleThemes[0].logoVars.frame,
            '--logo-img-opacity': cycleThemes[0].logoVars.image,
            '--logo-shadow-opacity': cycleThemes[0].logoVars.shadow
        });
        applyTheme(cycleThemes[0]);

        cycleThemes.forEach((theme, index) => {
            if (index === 0) return;
            tlFooter.to(footerPanelsPin, {
                backgroundColor: theme.color,
                '--frame-opacity': theme.logoVars.frame,
                '--logo-img-opacity': theme.logoVars.image,
                '--logo-shadow-opacity': theme.logoVars.shadow
            }, index - 1);
            tlFooter.call(applyTheme, [theme], index - 1 + 0.001);
        });

    }

    // ====================================
    // Footer Theme - troca de cor por seção (LEGADO, só se existir .footer-section)
    // ====================================
    const footer = document.querySelector('.footer-section');
    if (footer) {
        const setFooterTheme = (theme) => {
            footer.classList.remove('footer-theme-red','footer-theme-teal','footer-theme-yellow');
            footer.classList.add(theme);
        };

        ScrollTrigger.create({
            trigger: '.hero-section', start: 'top center', end: 'bottom center',
            onEnter: () => setFooterTheme('footer-theme-red'), onEnterBack: () => setFooterTheme('footer-theme-red')
        });
        ScrollTrigger.create({
            trigger: '.numbers-section', start: 'top center', end: 'bottom center',
            onEnter: () => setFooterTheme('footer-theme-teal'), onEnterBack: () => setFooterTheme('footer-theme-teal')
        });
        ScrollTrigger.create({
            trigger: '.about-section', start: 'top center', end: 'bottom center',
            onEnter: () => setFooterTheme('footer-theme-teal'), onEnterBack: () => setFooterTheme('footer-theme-teal')
        });
        ScrollTrigger.create({
            trigger: '.services-section', start: 'top center', end: 'bottom center',
            onEnter: () => setFooterTheme('footer-theme-yellow'), onEnterBack: () => setFooterTheme('footer-theme-yellow')
        });
        ScrollTrigger.create({
            trigger: '.localizacao-section', start: 'top center', end: 'bottom center',
            onEnter: () => setFooterTheme('footer-theme-red'), onEnterBack: () => setFooterTheme('footer-theme-red')
        });
    }

    console.log('All GSAP animations initialized ✅');

    // ====================================
    // Scrollspy: marcar link ativo baseado na seção
    // ====================================
    (function initScrollSpy(){
        const header = document.querySelector('.site-header');
        if (!header) return;
        const links = Array.from(header.querySelectorAll('.nav-list a[href^="#"]'));
        if (!links.length) return;

        const map = links
            .map(a => {
                const id = decodeURIComponent(a.getAttribute('href') || '').slice(1);
                const section = id ? document.getElementById(id) : null;
                return section ? { a, section } : null;
            })
            .filter(Boolean);

        const setActive = (el) => {
            links.forEach(l => l.classList.toggle('active', l === el));
        };

        if (typeof ScrollTrigger !== 'undefined') {
            map.forEach(({ a, section }) => {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top center',
                    end: 'bottom center',
                    onEnter: () => setActive(a),
                    onEnterBack: () => setActive(a)
                });
            });
        } else if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const found = map.find(m => m.section === entry.target);
                        if (found) setActive(found.a);
                    }
                });
            }, { rootMargin: '-40% 0% -40% 0%', threshold: 0 });
            map.forEach(m => io.observe(m.section));
        }
    })();
});
