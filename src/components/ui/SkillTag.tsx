interface SkillTagProps {
  skill: string
  onRemove?: () => void
}

export function SkillTag({ skill, onRemove }: SkillTagProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-indigo-900 transition-colors leading-none"
          aria-label={`Remove ${skill}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
