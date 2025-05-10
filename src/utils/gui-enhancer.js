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
  
  // Add hover effects to sliders
  const sliders = gui.domElement.querySelectorAll('.slider');
  sliders.forEach(slider => {
    const fill = slider.querySelector('.fill');
    
    // Enhance the fill element
    if (fill) {
      // Add glow effect on hover
      slider.addEventListener('mouseenter', () => {
        fill.style.boxShadow = '0 0 8px rgba(255, 80, 255, 0.5)';
      });
      
      slider.addEventListener('mouseleave', () => {
        fill.style.boxShadow = 'none';
      });
    }
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