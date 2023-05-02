export const useSmallScreen = () => useState<boolean | undefined>(
  'small-screen',
  () => false
)

export const useNavDrawerOpen = () => useState<boolean | undefined>(
  'nav-drawer-open',
  () => true
)

const smallScreenWidth = 800

export const smallScreen = useSmallScreen()
export const navDrawerOpen = useNavDrawerOpen()

if (window.innerWidth < smallScreenWidth) {
  smallScreen.value = true
  navDrawerOpen.value = false
}

export const onResize = () => {
  if (window.innerWidth < smallScreenWidth) smallScreen.value = true
  else {
    smallScreen.value = false
    if (!navDrawerOpen.value) navDrawerOpen.value = true
  }
}

export const toggleNavDrawer = () => {
  navDrawerOpen.value = !navDrawerOpen.value
}

export const closeNavIfSmall = () => {
  if (smallScreen.value && navDrawerOpen.value) navDrawerOpen.value = false
}
