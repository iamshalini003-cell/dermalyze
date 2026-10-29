/**
 * Analyze.tsx
 * Photo capture / upload → AI analysis → post-analysis questionnaire → holistic routine.
 */

import { useRef, useState } from 'react';
import { prepareImage, type PreparedImage } from '../lib/image';
import { analyzeAndSave, type SavedAnalysis } from '../lib/api';
import { generateRoutine } from '../lib/routine';
import type { QuestionnaireData } from '../lib/questionnaire';
import ResultCard from './ResultCard';
import Questionnaire from './Questionnaire';
import RoutineCard from './RoutineCard';
import { saveRoutineToStorage } from './Wellness';

type Phase =
  | 'capture'        // initial: pick / take photo
  | 'result'         // analysis done, showing result + prompt to fill questionnaire
  | 'questionnaire'  // multi-step questionnaire
  | 'routine';       // holistic routine card

export default function Analyze({ onSaved }: { onSaved: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [image,  setImage]  = useState<PreparedImage | null>(null);
  const [note,   setNote]   = useState('');
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [saved,  setSaved]  = useState<SavedAnalysis | null>(null);
  const [phase,  setPhase]  = useState<Phase>('capture');
  const [routine, setRoutine] = useState<ReturnType<typeof generateRoutine> | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSaved(null);
    setPhase('capture');
    setRoutine(null);
    try {
      setImage(await prepareImage(file));
    } catch (err) {
      setImage(null);
      setError(err instanceof Error ? err.message : 'Could not read the photo.');
    }
  }

  async function run() {
    if (!image) return;
    setBusy(true);
    setError('');
    try {
      const result = await analyzeAndSave(image, note.trim());
      setSaved(result);
      if (result.result.faceVisible) {
        onSaved();
        setPhase('result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleQuestionnaireComplete(data: QuestionnaireData) {
    if (!saved) return;
    const r = generateRoutine(data, saved.result);
    setRoutine(r);
    saveRoutineToStorage(r); // persist so Wellness tab can display it
    setPhase('routine');
  }

  function reset() {
    setImage(null);
    setNote('');
    setSaved(null);
    setPhase('capture');
    setRoutine(null);
    setError('');
    // Reset the file input so the same file can be selected again
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <div>
      {/* ── Photo capture card ── */}
      <section className="card">
        <h2>Analyze a photo</h2>
        <p className="muted">Use natural light, face the camera, no filters.</p>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onFile}
          hidden
        />
        <button
          className="secondary"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          type="button"
        >
          {image ? 'Choose a different photo' : 'Take or choose a photo'}
        </button>

        {image && phase === 'capture' && (
          <>
            <img className="preview" src={image.previewUrl} alt="Your selected photo" />
            <label className="field">
              Note (optional)
              <input
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. new face wash started today"
              />
            </label>
            <button className="primary" onClick={run} disabled={busy} type="button">
              {busy ? 'Analyzing… this takes a few seconds' : 'Analyze my skin'}
            </button>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {/* ── Analysis result ── */}
      {saved && (phase === 'result' || phase === 'questionnaire' || phase === 'routine') && (
        <ResultCard result={saved.result} />
      )}

      {/* ── Prompt to fill questionnaire ── */}
      {phase === 'result' && saved?.result.faceVisible && (
        <section className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Want a personalised routine?</h3>
          <p className="muted">
            Answer 3 quick questions about your lifestyle and products and we'll generate a
            full AM/PM skincare routine, diet plan, sleep tips, and yoga schedule — just for you.
          </p>
          <button className="primary" type="button" onClick={() => setPhase('questionnaire')}>
            Fill in questionnaire →
          </button>
          <button
            className="link"
            type="button"
            onClick={reset}
            style={{ display: 'block', margin: '8px auto 0' }}
          >
            Start over
          </button>
        </section>
      )}

      {/* ── Multi-step questionnaire ── */}
      {phase === 'questionnaire' && (
        <Questionnaire
          onComplete={handleQuestionnaireComplete}
          onSkip={reset}
        />
      )}

      {/* ── Holistic routine ── */}
      {phase === 'routine' && routine && (
        <>
          <RoutineCard routine={routine} onClose={reset} />
        </>
      )}
    </div>
  );
}
