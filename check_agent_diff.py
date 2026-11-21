"""Block sensitive changes from the agent, including untracked files."""
import subprocess, sys
tracked = subprocess.check_output(['git','diff','--name-only','HEAD'],text=True).splitlines()
untracked = subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
allowed_exact = {'index.html','CHANGELOG.md'}
allowed_prefix = ('src/','QA_')
allowed_names = lambda x: x.startswith('qa_') and (x.endswith('.py') or x.endswith('.js'))
invalid = [name for name in set(tracked+untracked) if not (name in allowed_exact or name.startswith(allowed_prefix) or allowed_names(name) or name=='.agent-task.md')]
if invalid:
    print('Forbidden agent modification(s):',*invalid,sep='\n - ',file=sys.stderr)
    sys.exit(1)
print('Agent diff has no forbidden paths.')
