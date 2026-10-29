import { DISCLAIMER } from '../lib/types';

export default function Consent({ onAccept }: { onAccept: () => void }) {
  return (
    <section className="card consent">
      <h2>Before you start</h2>
      <p>Dermalyze looks at a photo of your face to describe acne, dark circles and pigmentation.</p>
      <ul>
        <li>Your photos are stored in a private, encrypted space that only you can open.</li>
        <li>Photos are sent to Amazon Bedrock (AI) only to analyze them for you.</li>
        <li>You can delete any photo at any time from the History tab.</li>
      </ul>
      <p className="muted">{DISCLAIMER}</p>
      <button className="primary" onClick={onAccept}>
        I understand and agree
      </button>
    </section>
  );
}
