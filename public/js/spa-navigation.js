/**
 * Lightweight SPA Navigation for STARZO
 * Intercepts clicks and form submissions to provide a seamless UX.
 */

const SpaNavigation = {
    init() {
        this.mainSelector = 'main';
        this.loaderId = 'page-loader';
        
        // Intercept links
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // Intercept form submissions
        document.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // handle back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.url) {
                this.loadPage(e.state.url, false);
            } else {
                this.loadPage(window.location.href, false);
            }
        });

        console.log('SPA Navigation Initialized');
    },

    async loadPage(url, pushState = true) {
        this.showLoader();
        
        try {
            const response = await fetch(url, {
                headers: { 'X-SPA-Request': 'true' }
            });

            if (!response.ok) throw new Error('Page load failed');

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Update Title
            document.title = doc.title;

            // Update main content
            const newContent = doc.querySelector(this.mainSelector);
            const currentContent = document.querySelector(this.mainSelector);
            
            if (newContent && currentContent) {
                currentContent.innerHTML = newContent.innerHTML;
                
                // Refresh Breadcrumbs if any
                const newBread = doc.querySelector('.breadcrumbs-container'); // Adjust selector as per your partial
                const oldBread = document.querySelector('.breadcrumbs-container');
                if (newBread && oldBread) oldBread.innerHTML = newBread.innerHTML;
                
                // Re-initialize scripts in new content
                this.executeScripts(currentContent);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Update URL
                if (pushState) {
                    window.history.pushState({ url }, doc.title, url);
                }
                
                // Re-trigger Alpine.js if present
                if (window.Alpine) {
                    window.Alpine.discoverUninitializedComponents((el) => {
                        window.Alpine.initializeComponent(el);
                    });
                }
            } else {
                // Fallback to full reload if structure is different
                window.location.href = url;
            }
        } catch (err) {
            console.error('SPA Load Error:', err);
            window.location.href = url; // Fallback
        } finally {
            this.hideLoader();
        }
    },

    handleClick(e) {
        const a = e.target.closest('a');
        if (!a || !a.href) return;
        
        const url = new URL(a.href);
        const currentUrl = new URL(window.location.href);

        // Conditions for internal navigation
        const isInternal = url.origin === currentUrl.origin;
        const isSelf = a.target === '' || a.target === '_self';
        const isNotAsset = !url.pathname.match(/\.(pdf|jpg|png|zip)$/);
        const isNotLogout = !url.pathname.includes('logout');
        const isNotJavascript = !a.href.startsWith('javascript:');

        if (isInternal && isSelf && isNotAsset && isNotLogout && isNotJavascript && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            this.loadPage(a.href);
        }
    },

    async handleFormSubmit(e) {
        const form = e.target;
        if (form.getAttribute('data-no-spa') !== null) return;
        
        // Optional: Check if form should be SPA-ified
        // For now, let's only do it for searches or simple filters
        // Complex forms with file uploads might still need standard or specialized fetch handling.
        
        if (form.method.toLowerCase() === 'get') {
            e.preventDefault();
            const url = new URL(form.action || window.location.href);
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                url.searchParams.set(key, value);
            }
            this.loadPage(url.toString());
        }
    },

    showLoader() {
        let loader = document.getElementById(this.loaderId);
        if (loader) {
            loader.classList.remove('fade-out');
            loader.style.opacity = '1';
            loader.style.visibility = 'visible';
            // If it was removed from DOM, re-add it (some layouts might remove it)
            if (!document.body.contains(loader)) document.body.appendChild(loader);
        }
    },

    hideLoader() {
        const loader = document.getElementById(this.loaderId);
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                // Keep it in DOM but hidden
                loader.style.opacity = '0';
                loader.style.visibility = 'hidden';
            }, 500);
        }
    },

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
};

window.SpaNavigation = SpaNavigation;
document.addEventListener('DOMContentLoaded', () => SpaNavigation.init());
