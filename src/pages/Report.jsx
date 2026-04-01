import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import ReportForm from '../components/ReportForm';
import './Report.css';

export default function Report() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="page report-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>← {t('common.back')}</button>
        <h1 className="page-title">{t('report.title')}</h1>
      </div>

      <div className="page-content">
        <ReportForm />
      </div>
    </div>
  );
}
