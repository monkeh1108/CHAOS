"""Select one explicitly approved task. Never run unapproved drafts."""
from pathlib import Path
import os, subprocess, re
from urllib.parse import quote
p = Path('tasks/approved')
tasks = sorted(x for x in p.glob('*.md') if x.is_file())
selected = None
for task in tasks:
    branch = 'chaos-agent/' + re.sub(r'[^a-zA-Z0-9-]', '-', task.stem).lower()[:60]
    result = subprocess.run(['gh','pr','list','--repo',os.environ['GH_REPO'],'--state','all',
        '--head',branch,'--json','number','--jq','length'], capture_output=True, text=True, check=True)
    if result.stdout.strip() == '0':
        selected = (task,branch)
        break
with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
    if not selected:
        f.write('has_task=false\n')
        print('No approved task without an existing PR.')
    else:
        task,branch=selected
        title = re.sub(r'[^a-zA-Z0-9 ._-]', '', task.stem)[:70]
        f.write('has_task=true\n')
        f.write(f'task={task.as_posix()}\nbranch={branch}\ntitle={title}\n')
        Path('.agent-task.md').write_text(Path('.github/agent-prompt.md').read_text() + '\n\nAPPROVED TASK:\n' + task.read_text())
        print('Selected', task)
