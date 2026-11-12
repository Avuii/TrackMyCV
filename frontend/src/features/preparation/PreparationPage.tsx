import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { aiApi, type CvReviewDto, type PreparationResult } from '../../api/aiApi';

type Application = {
  id: string | number;
  company: string;
  position: string;
  level: string;
  requirements: string;
  documentId?: string | null;
};

type Cv = { id: string | number; name: string; fileName?: string; status?: string };
type Question = { id: string; text: string; answer: string; practiced: boolean };
type Collection = { id: string; title: string; applicationId: string; questions: Question[] };
type Template = { id: string; title: string; questions: string[] };
type JobPreparation = {
  id: string;
  description?: string;
  guide?: PreparationResult;
  comparison?: CvReviewDto;
};

export const dashboardWidgets = {
  metrics: 'Metrics',
  recent: 'Recent applications',
  insights: 'Recruitment insights',
  agenda: 'Upcoming events'
};

export type DashboardWidget = keyof typeof dashboardWidgets;
export type PreparationWorkspace = {
  jobs: JobPreparation[];
  collections: Collection[];
  templates: Template[];
  dashboard: { hidden: DashboardWidget[]; onboardingDismissed: boolean };
};

export const emptyPreparation: PreparationWorkspace = {
  jobs: [], collections: [], templates: [],
  dashboard: { hidden: [], onboardingDismissed: false }
};

type Props = {
  applications: Application[];
  cvs: Cv[];
  initialApplicationId: string;
  workspace: PreparationWorkspace;
  setWorkspace: Dispatch<SetStateAction<PreparationWorkspace>>;
  documentsLoading: boolean;
  documentsError: string | null;
  refreshDocuments: () => void;
  openDocuments: () => void;
  addApplication: () => void;
};

export function PreparationPage({
  applications, cvs, initialApplicationId, workspace, setWorkspace, documentsLoading,
  documentsError, refreshDocuments, openDocuments, addApplication
}: Props) {
  const [applicationId, setApplicationId] = useState(initialApplicationId);
  const application = applications.find(item => String(item.id) === applicationId) ?? applications[0];

  return (
    <section className="page-section preparation-page" aria-label="Interview preparation">
      {!application ? (
        <div className="panel-card empty-state">
          <h2>Prepare for an application</h2>
          <p>Add an application to summarize the offer, compare your CV and collect practice questions.</p>
          <button className="primary-button" type="button" onClick={addApplication}>Add application</button>
        </div>
      ) : (
        <>
          <label className="form-field preparation-picker">
            <span>Application</span>
            <select value={String(application.id)} onChange={event => setApplicationId(event.target.value)}>
              {applications.map(item => <option key={item.id} value={String(item.id)}>{item.position} · {item.company}</option>)}
            </select>
          </label>
          <ApplicationPreparation key={application.id} application={application} cvs={cvs}
            workspace={workspace} setWorkspace={setWorkspace} documentsLoading={documentsLoading}
            documentsError={documentsError} refreshDocuments={refreshDocuments} openDocuments={openDocuments} />
        </>
      )}
      <Templates templates={workspace.templates} setWorkspace={setWorkspace} />
    </section>
  );
}

type ApplicationPreparationProps = Pick<Props, 'cvs' | 'workspace' | 'setWorkspace' |
  'documentsLoading' | 'documentsError' | 'refreshDocuments' | 'openDocuments'> & { application: Application };

function ApplicationPreparation({
  application, cvs, workspace, setWorkspace, documentsLoading, documentsError, refreshDocuments, openDocuments
}: ApplicationPreparationProps) {
  const id = String(application.id);
  const job = workspace.jobs.find(item => item.id === id);
  const description = job?.description ?? application.requirements;
  const eligibleCvs = cvs.filter(cv => cv.fileName && /\.(pdf|docx|txt|rtf)$/i.test(cv.fileName) &&
    (cv.status !== 'Archived' || String(cv.id) === application.documentId));
  const [selectedCv, setSelectedCv] = useState(job?.comparison?.documentId ?? application.documentId ?? '');
  const cv = eligibleCvs.find(item => String(item.id) === selectedCv);
  const [language, setLanguage] = useState<'en' | 'pl'>('en');
  const [pending, setPending] = useState<'guide' | 'comparison'>();
  const [error, setError] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function updateJob(changes: Partial<Omit<JobPreparation, 'id'>>) {
    setWorkspace(current => {
      const existing = current.jobs.find(item => item.id === id);
      const updated = { ...existing, ...changes, id };
      return { ...current, jobs: existing
        ? current.jobs.map(item => item.id === id ? updated : item)
        : [...current.jobs, updated] };
    });
  }

  async function generate(kind: 'guide' | 'comparison') {
    setPending(kind);
    setError('');
    try {
      if (kind === 'guide') {
        const guide = await aiApi.generatePreparation(id, description, language);
        updateJob({ guide });
      } else if (cv) {
        const comparison = await aiApi.createCvReview({
          documentId: String(cv.id), reviewType: 'job-match', language,
          jobTitle: application.position, experienceLevel: application.level, jobDescription: description
        });
        updateJob({ comparison });
      }
    } catch (requestError) {
      if (mounted.current) setError(requestError instanceof Error ? requestError.message : 'Generation failed. Try again.');
    } finally {
      if (mounted.current) setPending(undefined);
    }
  }

  function createCollection(title: string, questions: string[]) {
    const collection = {
      id: crypto.randomUUID(), title, applicationId: id,
      questions: questions.map(text => ({ id: crypto.randomUUID(), text, answer: '', practiced: false }))
    };
    setWorkspace(current => ({ ...current, collections: [...current.collections, collection] }));
  }

  const result = job?.comparison?.result;
  return (
    <>
      <section className="panel-card preparation-card">
        <h2>Job analysis</h2>
        <label className="form-field">
          <span>Job description</span>
          <textarea rows={6} maxLength={14000} value={description} disabled={Boolean(pending)}
            onChange={event => updateJob({ description: event.target.value })}
            placeholder="Paste the job description or the responsibilities you want to prepare for." />
        </label>
        <div className="preparation-fields">
          <label className="form-field">
            <span>AI response language</span>
            <select value={language} disabled={Boolean(pending)} onChange={event => setLanguage(event.target.value === 'pl' ? 'pl' : 'en')}>
              <option value="en">English</option><option value="pl">Polski</option>
            </select>
          </label>
          <label className="form-field">
            <span>CV for comparison</span>
            <select value={cv ? String(cv.id) : ''} disabled={documentsLoading || Boolean(pending)} onChange={event => setSelectedCv(event.target.value)}>
              <option value="">Choose a CV file</option>
              {eligibleCvs.map(item => <option key={item.id} value={String(item.id)}>{item.name} · {item.fileName}</option>)}
            </select>
          </label>
        </div>
        {documentsLoading && <p role="status">Loading CV files…</p>}
        {documentsError && <div role="alert">{documentsError} <button className="text-button" type="button" onClick={refreshDocuments}>Retry</button></div>}
        {!documentsLoading && !documentsError && !eligibleCvs.length && (
          <button className="text-button" type="button" onClick={openDocuments}>Upload a CV in Documents</button>
        )}
        <div className="preparation-actions">
          <button className="primary-button" type="button" disabled={!description.trim() || Boolean(pending)} onClick={() => void generate('guide')}>Generate interview guide</button>
          <button className="secondary-button" type="button" disabled={!description.trim() || !cv || Boolean(pending)} onClick={() => void generate('comparison')}>Compare CV with job</button>
        </div>
        {pending && <p role="status">{pending === 'guide' ? 'Generating interview guide…' : 'Comparing your CV with the job…'}</p>}
        {error && <p role="alert">{error}</p>}
      </section>

      {job?.guide && <section className="panel-card preparation-card">
        <h2>Interview guide</h2>
        <h3>Job summary</h3>
        <p>{job.guide.summary}</p>
        <ResultList title="Suggested next steps" items={job.guide.suggestions} />
        <ResultList title="Practice questions" items={job.guide.questions} />
        <button className="secondary-button" type="button"
          onClick={() => createCollection('AI practice questions', job.guide!.questions)}>Save questions as collection</button>
      </section>}

      {result && <section className="panel-card preparation-card">
        <h2>CV comparison</h2>
        <p><strong>{job?.comparison?.documentName}</strong>{result.jobMatchScore != null && ` · Job match ${result.jobMatchScore}%`}</p>
        <p>{result.summary}</p>
        <ResultList title="Relevant strengths" items={result.strengths} />
        <ResultList title="Missing keywords" items={result.missingKeywords} />
        <ResultList title="Recommended actions" items={result.recommendedActions} />
      </section>}

      <section className="panel-card preparation-card">
        <h2>Interview collections</h2>
        <form className="preparation-form" onSubmit={event => {
          event.preventDefault();
          if (!collectionTitle.trim()) return;
          createCollection(collectionTitle.trim(), workspace.templates.find(item => item.id === templateId)?.questions ?? []);
          setCollectionTitle('');
          setTemplateId('');
        }}>
          <div className="preparation-fields">
            <label className="form-field"><span>Collection name</span><input value={collectionTitle} required maxLength={100}
              onChange={event => setCollectionTitle(event.target.value)} /></label>
            <label className="form-field"><span>Start from a template</span>
              <select value={templateId} onChange={event => setTemplateId(event.target.value)}>
                <option value="">Empty collection</option>
                {workspace.templates.map(template => <option key={template.id} value={template.id}>{template.title}</option>)}
              </select>
            </label>
          </div>
          <button className="secondary-button" type="submit">Create collection</button>
        </form>
        {workspace.collections.filter(item => item.applicationId === id).map(item =>
          <CollectionEditor key={item.id} collection={item} setWorkspace={setWorkspace} />)}
      </section>
    </>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div><h3>{title}</h3><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>;
}

function CollectionEditor({ collection, setWorkspace }: {
  collection: Collection;
  setWorkspace: Props['setWorkspace'];
}) {
  const [text, setText] = useState('');
  function updateQuestions(update: (questions: Question[]) => Question[]) {
    setWorkspace(current => ({ ...current, collections: current.collections.map(item => item.id === collection.id
      ? { ...item, questions: update(item.questions) } : item) }));
  }

  return <details className="preparation-collection">
    <summary>{collection.title} · {collection.questions.filter(question => question.practiced).length}/{collection.questions.length} practiced</summary>
    <div className="preparation-form">
      {collection.questions.map(question => <div className="preparation-question" key={question.id}>
        <label className="preparation-check">
          <input type="checkbox" checked={question.practiced}
            onChange={event => {
              const practiced = event.target.checked;
              updateQuestions(items => items.map(item => item.id === question.id ? { ...item, practiced } : item));
            }} />
          <span>{question.text}</span>
        </label>
        <label className="form-field"><span>Practice answer</span>
          <textarea rows={2} value={question.answer} maxLength={6000}
            onChange={event => {
              const answer = event.target.value;
              updateQuestions(items => items.map(item => item.id === question.id ? { ...item, answer } : item));
            }} />
        </label>
        <button className="text-button" type="button" aria-label={`Remove question: ${question.text}`}
          onClick={() => updateQuestions(items => items.filter(item => item.id !== question.id))}>Remove question</button>
      </div>)}
      <form className="preparation-form" onSubmit={event => {
        event.preventDefault();
        if (!text.trim()) return;
        const question = { id: crypto.randomUUID(), text: text.trim(), answer: '', practiced: false };
        updateQuestions(items => [...items, question]);
        setText('');
      }}>
        <label className="form-field"><span>New question</span><input required maxLength={800} value={text}
          onChange={event => setText(event.target.value)} /></label>
        <button className="secondary-button" type="submit">Add question</button>
      </form>
      <button className="text-button" type="button" onClick={() => {
        if (!window.confirm(`Delete “${collection.title}” and its practice answers?`)) return;
        setWorkspace(current => ({ ...current, collections: current.collections.filter(item => item.id !== collection.id) }));
      }}>Delete collection</button>
    </div>
  </details>;
}

function Templates({ templates, setWorkspace }: { templates: Template[]; setWorkspace: Props['setWorkspace'] }) {
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  function edit(template?: Template) {
    setEditingId(template?.id ?? '');
    setTitle(template?.title ?? '');
    setText(template?.questions.join('\n') ?? '');
  }

  return <section className="panel-card preparation-card">
    <h2>Interview templates</h2>
    {templates.length > 0 && <ul className="preparation-templates">
      {templates.map(template => <li key={template.id}>
        <span>{template.title} · {template.questions.length} questions</span>
        <button className="text-button" type="button" aria-label={`Edit ${template.title}`} onClick={() => edit(template)}>Edit</button>
        <button className="text-button" type="button" aria-label={`Delete ${template.title}`} onClick={() => {
          if (!window.confirm(`Delete the template “${template.title}”?`)) return;
          setWorkspace(current => ({ ...current, templates: current.templates.filter(item => item.id !== template.id) }));
          if (editingId === template.id) edit();
        }}>Delete</button>
      </li>)}
    </ul>}
    <form className="preparation-form" onSubmit={event => {
      event.preventDefault();
      const questions = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (!title.trim() || !questions.length) return;
      const template = { id: editingId || crypto.randomUUID(), title: title.trim(), questions };
      setWorkspace(current => ({ ...current, templates: current.templates.some(item => item.id === template.id)
        ? current.templates.map(item => item.id === template.id ? template : item) : [...current.templates, template] }));
      edit();
    }}>
      <label className="form-field"><span>Template name</span><input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label className="form-field"><span>Questions, one per line</span><textarea required rows={4} maxLength={12000} value={text} onChange={event => setText(event.target.value)} /></label>
      <div className="preparation-actions">
        <button className="secondary-button" type="submit">{editingId ? 'Update template' : 'Save template'}</button>
        {editingId && <button className="text-button" type="button" onClick={() => edit()}>Cancel editing</button>}
      </div>
    </form>
  </section>;
}
