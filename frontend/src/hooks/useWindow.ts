const useWindow = () => {
  const isClient = typeof window !== 'undefined';

  const scrollToTop = () => {
    if (!isClient) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { scrollToTop }
}

export default useWindow;
