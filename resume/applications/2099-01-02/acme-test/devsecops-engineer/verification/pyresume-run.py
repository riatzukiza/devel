import json
import sys
from pyresume import ResumeParser
parser = ResumeParser()
data = parser.parse(sys.argv[1])
md = getattr(data, 'extraction_metadata', None)
out = {
  'contact': {
    'name': getattr(data.contact_info, 'name', None),
    'email': getattr(data.contact_info, 'email', None),
    'phone': getattr(data.contact_info, 'phone', None),
    'github': getattr(data.contact_info, 'github', None),
  },
  'counts': {
    'education': len(getattr(data, 'education', []) or []),
    'experience': len(getattr(data, 'experience', []) or []),
    'skills': len(getattr(data, 'skills', []) or []),
    'certifications': len(getattr(data, 'certifications', []) or []),
    'projects': len(getattr(data, 'projects', []) or []),
  },
  'sections_found': md.get('sections_found') if isinstance(md, dict) else None,
  'overall_confidence': md.get('overall_confidence') if isinstance(md, dict) else None,
}
print(json.dumps(out, indent=2))