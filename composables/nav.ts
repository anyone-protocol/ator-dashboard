const route = useRoute()

export const navItems = ref([
  {
    label: 'Dashboard',
    icon: 'mdi-speedometer',
    to: '/'
  },
  {
    label: 'My Relays',
    icon: 'mdi-lifebuoy',
    to: '/my-relays'
  },
  {
    label: 'Register',
    icon: 'mdi-clipboard-edit-outline',
    to: '/register'
  },
  {
    label: 'Purchase',
    icon: 'mdi-ethereum',
    to: '/purchase',
    disabled: true
  }
])

export const currentPageTitle = computed(() => {
    const currentNavItem = navItems.value.find(item => {
      if (route.name === item.to.substring(1)) {
        return true
      }
      
      if (route.name === 'index' && item.to === '/') {
        return true
      }
  
      return false
    })
    
    return currentNavItem ? currentNavItem.label : ''
})