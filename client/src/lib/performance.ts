// Performance optimization utilities
export function preloadRoute(routePath: string) {
  // Preload critical routes
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
}

export function optimizeImages() {
  // Add loading="lazy" to all images
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Critical resource preloader
export function preloadCriticalResources() {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/src/index.css';
  document.head.appendChild(criticalCSS);
  
  // Preload Font Awesome for icons
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'preload';
  fontAwesome.as = 'style';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
  document.head.appendChild(fontAwesome);
}

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  // Run optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalResources();
      optimizeImages();
    });
  } else {
    preloadCriticalResources();
    optimizeImages();
  }
  
  // Optimize images when new content loads
  const observer = new MutationObserver(() => {
    optimizeImages();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}