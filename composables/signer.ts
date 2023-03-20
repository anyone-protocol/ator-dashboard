export const useSigner = async () => {
  const provider = useProvider()
  if (!provider) {
    // TODO -> inform user they must connect with browser wallet

    return null
  } else {
    return await provider.getSigner()
  }
}
