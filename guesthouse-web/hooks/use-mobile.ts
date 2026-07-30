import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Largest CSS landscape width a current phone-class (coarse-pointer) device
// reaches, with headroom above iPhone 14 Pro Max's 932px landscape width, so
// a rotated phone is still treated as mobile while touch tablets (iPad ~1024px+)
// remain on the desktop sidebar layout. Product-confirmed ceiling per REQ-020.
const MOBILE_LANDSCAPE_WIDTH_CEILING = 950

function computeIsMobile() {
  const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
  const isCoarsePointerPhone =
    window.matchMedia("(pointer: coarse)").matches &&
    window.innerWidth < MOBILE_LANDSCAPE_WIDTH_CEILING
  return isNarrow || isCoarsePointerPhone
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const widthMql = window.matchMedia(`(max-width: ${MOBILE_LANDSCAPE_WIDTH_CEILING - 1}px)`)
    const pointerMql = window.matchMedia("(pointer: coarse)")
    const onChange = () => {
      setIsMobile(computeIsMobile())
    }
    widthMql.addEventListener("change", onChange)
    pointerMql.addEventListener("change", onChange)
    setIsMobile(computeIsMobile())
    return () => {
      widthMql.removeEventListener("change", onChange)
      pointerMql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}
