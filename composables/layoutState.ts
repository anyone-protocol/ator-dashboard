export const useSmallScreen = () => useState<boolean | undefined>(
  'small-screen',
  () => false
)

export const useNavDrawerOpen = () => useState<boolean | undefined>(
  'nav-drawer-open',
  () => true
)

// Make decisions about this / these numbers
const smallScreenWidth = 800;

const smallScreen = useSmallScreen()
const navDrawerOpen = useNavDrawerOpen()

if (window.innerWidth < smallScreenWidth) {
  smallScreen.value = true
  navDrawerOpen.value = false
}

window.addEventListener('resize', () => {
  if (window.innerWidth < smallScreenWidth) smallScreen.value = true
  else {
    smallScreen.value = false
    if (!navDrawerOpen.value) navDrawerOpen.value = true
  }
}, true)

