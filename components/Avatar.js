// A person as a colored initial; with no user it stands for the whole team.
export default function Avatar({ user, users, size = '', title }) {
  const cls = `avatar ${size ? `avatar--${size}` : ''}`;
  if (!user) {
    if (users?.length)
      return (
        <span className="avatar-pair" title={title ?? 'هر دو نفر'} role="img" aria-label={title ?? 'هر دو نفر'}>
          {users.map((u) => (
            <span key={u.id} className={cls} style={{ '--c': `var(--c-${u.color})` }} aria-hidden>
              {u.name.slice(0, 1)}
            </span>
          ))}
        </span>
      );
    return (
      <span className={`${cls} avatar--team`} role="img" aria-label="تیم">
        ت
      </span>
    );
  }
  return (
    <span className={cls} style={{ '--c': `var(--c-${user.color})` }} title={title ?? user.name} role="img" aria-label={title ?? user.name}>
      {user.name.slice(0, 1)}
    </span>
  );
}
