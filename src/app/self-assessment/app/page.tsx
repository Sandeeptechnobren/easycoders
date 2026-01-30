import AssessmentCards from './AssessmentCards';

export default function AssessmentDashboard() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
        Active Assessments
      </h1>

      <AssessmentCards />
    </>
  );
}
