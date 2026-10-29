import { DISCLAIMER, type AnalysisResult, type Concern } from '../lib/types';

const LABELS: Record<string, string> = {
  none: 'None',
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

function ConcernRow({ title, concern }: { title: string; concern: Concern }) {
  return (
    <div className="concern">
      <div className="concern-head">
        <strong>{title}</strong>
        <span className={`chip chip-${concern.severity}`}>{LABELS[concern.severity]}</span>
      </div>
      <p>{concern.explanation}</p>
    </div>
  );
}

export default function ResultCard({ result }: { result: AnalysisResult }) {
  if (!result.faceVisible) {
    return (
      <section className="card">
        <h3>We could not see your face clearly</h3>
        <p>{result.retakeReason || 'Please take a clear, well-lit photo facing the camera.'}</p>
      </section>
    );
  }

  const anySevere = [result.acne, result.darkCircles, result.pigmentation].some(
    (c) => c.severity === 'severe'
  );

  return (
    <section className="card">
      <h3>Your skin insights</h3>
      <p>{result.summary}</p>
      <ConcernRow title="Acne" concern={result.acne} />
      <ConcernRow title="Dark circles" concern={result.darkCircles} />
      <ConcernRow title="Pigmentation" concern={result.pigmentation} />
      {result.nextStep && (
        <p className="next-step">
          <strong>Next step:</strong> {result.nextStep}
        </p>
      )}
      {anySevere && (
        <p className="warn">One or more concerns look severe. Please consider seeing a dermatologist.</p>
      )}
      <p className="muted">{DISCLAIMER}</p>
    </section>
  );
}
