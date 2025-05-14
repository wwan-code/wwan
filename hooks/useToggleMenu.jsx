import { useState, useEffect, useCallback } from 'react';

const LAYOUT_BREAKPOINT = 1200; // Điểm ngắt màn hình nhỏ

const useToggleMenu = () => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsMenuExpanded(!isMenuExpanded);
  }, [isMenuExpanded]);

  const _addClass = (className, element = document.querySelector('.layout-menu')) => {
    if (element) {
      className.split(" ").forEach(cls => element.classList.add(cls));
    }
  };

  const _removeClass = (className, element = document.querySelector('.layout-menu')) => {
    if (element) {
      className.split(" ").forEach(cls => element.classList.remove(cls));
    }
  };

  const _setCollapsed = useCallback((collapsed) => {
    if (isSmallScreenCheck()) {
      collapsed ? _removeClass("layout-menu-expanded") : setTimeout(() => _addClass("layout-menu-expanded"), 5);
    } else {
      collapsed ? _addClass("layout-menu-collapsed") : _removeClass("layout-menu-collapsed");
    }
  }, []);

  const isSmallScreenCheck = () => {
    return (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) < LAYOUT_BREAKPOINT;
  };

  useEffect(() => {
    const checkSmallScreen = () => {
      setIsSmallScreen(isSmallScreenCheck());
    };
  
    checkSmallScreen();
  
    window.addEventListener('resize', checkSmallScreen);
  
    return () => {
      window.removeEventListener('resize', checkSmallScreen);
    };
  }, []);

  useEffect(() => {
    _setCollapsed(!isMenuExpanded);
  }, [isMenuExpanded, _setCollapsed]);

  const _hasClass = useCallback((className, element = document.querySelector('.layout-menu')) => {
    return element && className.split(" ").some(cls => element.classList.contains(cls));
  }, []);

  const isCollapsed = useCallback(() => {
    return isSmallScreen ? !_hasClass("layout-menu-expanded") : _hasClass("layout-menu-collapsed");
  }, [isSmallScreen, _hasClass]);

  const setCollapsed = useCallback((collapsed = false, animate = true) => {
    if (getLayoutMenu()) {
      _unbindLayoutAnimationEndEvent();

      if (animate && _supportsTransitionEnd()) {
        _addClass("layout-transitioning");
        if (collapsed) _setMenuHoverState(false);

        _bindLayoutAnimationEndEvent(
          () => _setCollapsed(collapsed),
          () => {
            _removeClass("layout-transitioning");
            _triggerWindowEvent("resize");
            _triggerEvent("toggle");
            _setMenuHoverState(false);
          }
        );
      } else {
        _addClass("layout-no-transition");
        if (collapsed) _setMenuHoverState(false);

        _setCollapsed(collapsed);

        setTimeout(() => {
          _removeClass("layout-no-transition");
          _triggerWindowEvent("resize");
          _triggerEvent("toggle");
          _setMenuHoverState(false);
        }, 1);
      }
    }
  }, []);


  const toggleCollapsed = useCallback((animate = true) => {
    setCollapsed(!isCollapsed(), animate);
  }, [isCollapsed, setCollapsed]);
  const getLayoutMenu = useCallback(() => {
    return document.querySelector(".layout-menu");
  }, []);

  const _supportsTransitionEnd = useCallback(() => {
    return 'transition' in document.documentElement.style;
  }, []);

  const _bindLayoutAnimationEndEvent = useCallback((callback, completeCallback) => {
    const layoutMenu = getLayoutMenu();
    if (layoutMenu) {
      layoutMenu.addEventListener('transitionend', completeCallback);
      callback();
    }
  }, [getLayoutMenu]);

  const _unbindLayoutAnimationEndEvent = useCallback(() => {
    const layoutMenu = getLayoutMenu();
    if (layoutMenu) {
      layoutMenu.removeEventListener('transitionend', () => { });
    }
  }, [getLayoutMenu]);

  const _triggerWindowEvent = useCallback((eventName) => {
    window.dispatchEvent(new Event(eventName));
  }, []);

  const _triggerEvent = useCallback((eventName) => {
    const layoutMenu = getLayoutMenu();
    if (layoutMenu) {
      layoutMenu.dispatchEvent(new Event(eventName));
    }
  }, [getLayoutMenu]);

  const _setMenuHoverState = useCallback((hover) => {
    const layoutMenu = getLayoutMenu();
    if (layoutMenu) {
      layoutMenu.classList.toggle('layout-menu-hover', hover);
    }
  }, [getLayoutMenu]);

  const handleResize = useCallback(() => {
    if (window.innerWidth < 1200) {
      _removeClass("layout-menu-collapsed");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return {
    isMenuExpanded,
    handleToggle,
    isCollapsed,
    toggleCollapsed,
    setCollapsed,
  };
};

export default useToggleMenu;