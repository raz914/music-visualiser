/**
 * GUI Enhancer - Adds additional features to lil-gui
 * This utility adds animations, custom styles, and improved user experience
 */

/**
 * Enhances the lil-gui interface with custom animations and styling
 * @param {GUI} gui - The lil-gui instance to enhance
 */
export function enhanceGUI(gui) {
  // Add custom class for our styling
  gui.domElement.classList.add('enhanced-gui');
  
  // Make folders collapsible with smooth animations
  const folders = gui.domElement.querySelectorAll('.folder');
  folders.forEach(folder => {
    const title = folder.querySelector('.title');
    const children = folder.querySelector('.children');
    
    // Add animation classes
    children.style.transition = 'max-height 0.3s ease, opacity 0.2s ease';
    children.style.overflow = 'hidden';
    
    // Add pink accent to folder icons
    const folderIcon = title.querySelector('.icon');
    if (folderIcon) {
      folderIcon.style.color = '#ff50ff';
    }
    
    // Handle smooth opening/closing animation
    title.addEventListener('click', () => {
      if (folder.classList.contains('closed')) {
        // Opening animation
        const height = Array.from(children.children).reduce(
          (height, child) => height + child.offsetHeight, 0
        );
        children.style.maxHeight = `${height}px`;
        children.style.opacity = '1';
        
        // Add delay to match the animation
        setTimeout(() => {
          children.style.maxHeight = 'none';
        }, 300);
      } else {
        // Get current height and set it explicitly to allow animation
        const height = children.offsetHeight;
        children.style.maxHeight = `${height}px`;
        
        // Trigger reflow
        children.offsetHeight;
        
        // Closing animation
        children.style.maxHeight = '0px';
        children.style.opacity = '0';
      }
    });
  });
  
  // Optimize sliders for better responsiveness
  enhanceSliders(gui.domElement);
  
  // Watch for new controllers that might be added later
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        // Check if any new sliders were added
        const newSliders = Array.from(mutation.addedNodes)
          .filter(node => node.nodeType === 1) // Only element nodes
          .map(node => node.querySelectorAll ? Array.from(node.querySelectorAll('.slider')) : [])
          .flat();
          
        if (newSliders.length) {
          newSliders.forEach(enhanceSlider);
        }
      }
    });
  });
  
  // Start observing the DOM for changes
  observer.observe(gui.domElement, { 
    childList: true, 
    subtree: true 
  });
  
  // Add pulsing effect to active controller
  const controllers = gui.domElement.querySelectorAll('.controller');
  controllers.forEach(controller => {
    controller.addEventListener('click', () => {
      controller.classList.add('active-control');
      setTimeout(() => {
        controller.classList.remove('active-control');
      }, 300);
    });
  });
  
  // Make the GUI closed by default
  gui.close();
  
  return gui;
}

/**
 * Enhances all sliders in a given container
 * @param {HTMLElement} container - Container element that may contain sliders
 */
function enhanceSliders(container) {
  const sliders = container.querySelectorAll('.slider');
  sliders.forEach(enhanceSlider);
}

/**
 * Enhances a single slider for better responsiveness
 * @param {HTMLElement} slider - The slider element to enhance
 */
function enhanceSlider(slider) {
  const fill = slider.querySelector('.fill');
  const controller = slider.closest('.controller');
  if (!fill || !controller) return;
  
  // Get the corresponding input field
  const input = controller.querySelector('input[type="text"]');
  if (!input) return;
  
  // Find the min/max values from the controller's parent (accessing lil-gui controller object)
  const controllerInstance = controller.__controller;
  if (!controllerInstance) return;
  
  const min = controllerInstance._min !== undefined ? controllerInstance._min : 0;
  const max = controllerInstance._max !== undefined ? controllerInstance._max : 1;
  
  // Remove the default transition for more immediate feedback
  fill.style.transition = 'none';
  
  // Direct manipulation functions
  const updateFillDirectly = (clientX) => {
    const rect = slider.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const value = min + percent * (max - min);
    
    // Update the fill bar width directly
    fill.style.width = `${percent * 100}%`;
    
    // Update the input value directly
    if (input) {
      const precision = controllerInstance._precision !== undefined ? controllerInstance._precision : 2;
      input.value = value.toFixed(precision);
      
      // Dispatch input event to trigger onChange callbacks
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
    
    return value;
  };
  
  // Touch/Mouse event handling with pointer events
  let isPointerDown = false;
  
  // Use pointer events for better cross-device compatibility
  slider.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    slider.setPointerCapture(e.pointerId);
    
    // Initial update
    updateFillDirectly(e.clientX);
    
    // Add active class for visual feedback
    slider.classList.add('slider-active');
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  slider.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    updateFillDirectly(e.clientX);
    e.preventDefault();
  });
  
  const endPointerInteraction = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    
    // Final update
    updateFillDirectly(e.clientX);
    
    // Remove active class
    slider.classList.remove('slider-active');
    
    // Dispatch change event
    if (input) {
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
    
    e.preventDefault();
  };
  
  slider.addEventListener('pointerup', endPointerInteraction);
  slider.addEventListener('pointercancel', endPointerInteraction);
  
  // Visual effects
  slider.addEventListener('pointerenter', () => {
    fill.style.boxShadow = '0 0 8px rgba(255, 80, 255, 0.5)';
  });
  
  slider.addEventListener('pointerleave', (e) => {
    fill.style.boxShadow = 'none';
    if (isPointerDown) {
      endPointerInteraction(e);
    }
  });
  
  // Make non-draggable elements not interfere with dragging
  slider.querySelectorAll('*').forEach(el => {
    if (el !== fill) {
      el.style.pointerEvents = 'none';
    }
  });
  
  // Add data attribute for debugging
  slider.setAttribute('data-enhanced', 'true');
} 