const base = import.meta.env.BASE_URL;

export function UnitedBrands({ paused = false }: { paused?: boolean }) {
  return (
    <div className={`ub ${paused ? "is-paused" : ""}`} data-testid="brand-united" aria-label="Zendesk, Local Measure and AWS working together">
      <div className="ub-row">
        <div className="ub-mark" data-testid="brand-zendesk">
          <img src={`${base}brand/zendesk-logo.svg`} alt="Zendesk" className="ub-zd" />
        </div>
        <span className="ub-link" aria-hidden><i /></span>
        <div className="ub-mark" data-testid="brand-local-measure">
          <img src={`${base}brand/local-measure.png`} alt="" width={30} height={30} className="ub-lm" />
          <span className="ub-lm-text">Local Measure</span>
        </div>
        <span className="ub-link" aria-hidden><i /></span>
        <div className="ub-mark" data-testid="brand-aws">
          <img src={`${base}brand/aws.svg`} alt="Amazon Web Services" className="ub-aws" />
        </div>
      </div>
      <p className="ub-note">Connected expertise. One contact center story.<span className="ub-disclaimer">Product marks shown for architecture context.</span></p>
    </div>
  );
}
