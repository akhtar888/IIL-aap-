import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className="glass grid h-9 w-9 place-items-center rounded-xl text-lg transition hover:bg-white/40 dark:hover:bg-white/10">
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
