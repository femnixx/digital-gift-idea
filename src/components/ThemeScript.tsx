const THEME_SCRIPT = `(function(){try{
var k='dll-theme';var s=localStorage.getItem(k);
var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
var e=document.documentElement;
e.setAttribute('data-theme',t);
e.classList.toggle('dark',t==='dark');
}catch(_){}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
}