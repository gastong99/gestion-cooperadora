const CampoError = ({ error }: { error?: string }) =>
  error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null;

export default CampoError;