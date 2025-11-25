import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RELATIONSHIP_LABELS } from '../../api/endpoints/relationship';
import api from '../../api/clients/http';
import Header from '../../components/layout/Header';
import styles from './KakaoUploadPage.module.css';

const KakaoUploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [relationshipCategory, setRelationshipCategory] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [embeddingStage, setEmbeddingStage] = useState('');
  const [error, setError] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('카카오톡 대화 파일(.txt)만 업로드 가능합니다');
      }
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('카카오톡 대화 파일(.txt)만 업로드 가능합니다');
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요');
      return;
    }

    if (!partnerName.trim()) {
      setError('상대방 이름을 입력해주세요');
      return;
    }

    if (!relationshipCategory) {
      setError('관계 카테고리를 선택해주세요');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('partner_name', partnerName.trim());
      formData.append('relationship_category', relationshipCategory);

      // axios로 API 호출 (자동 토큰 갱신 지원)
      const response = await api.post('/kakao/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      console.log('업로드 결과:', result); // 디버깅용
      setUploadProgress(100);
      setUploadResult(result);
      setUploading(false);

      // 업로드 성공 체크마크 표시 (1.5초)
      setUploadSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadSuccess(false);

      // 자동으로 임베딩 시작
      await handleGenerateEmbeddings();

    } catch (err) {
      console.error('업로드 실패:', err);
      setError(err.response?.data?.message || err.message || '업로드 중 오류가 발생했습니다');
      setUploading(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    try {
      setEmbedding(true);
      setError(null);
      setEmbeddingProgress(0);
      setEmbeddingStage('대화 내용 분석 중...');

      // 진행률 및 단계별 메시지 시뮬레이션
      const stages = [
        { progress: 15, message: '대화 내용 분석 중...', duration: 2000 },
        { progress: 30, message: '말투 패턴 학습 중...', duration: 3000 },
        { progress: 50, message: 'AI 임베딩 생성 중...', duration: 4000 },
        { progress: 70, message: '데이터 최적화 중...', duration: 3000 },
        { progress: 85, message: '마무리 작업 중...', duration: 2000 }
      ];

      let currentStageIndex = 0;
      const stageInterval = setInterval(() => {
        if (currentStageIndex < stages.length) {
          const stage = stages[currentStageIndex];
          setEmbeddingProgress(stage.progress);
          setEmbeddingStage(stage.message);
          currentStageIndex++;
        }
      }, 3000);

      // 부드러운 진행률 증가 애니메이션
      const smoothProgressInterval = setInterval(() => {
        setEmbeddingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 0.5;
        });
      }, 150);

      // axios로 API 호출 (자동 토큰 갱신 지원, 타임아웃 60초)
      const response = await api.post('/kakao/generate-embeddings', {}, {
        timeout: 60000 // 60초
      });

      clearInterval(stageInterval);
      clearInterval(smoothProgressInterval);

      console.log('임베딩 결과:', response.data); // 디버깅용
      setEmbeddingProgress(100);
      setEmbeddingStage('완료!');

    } catch (err) {
      console.error('임베딩 생성 실패:', err);
      setError(err.response?.data?.message || err.message || '임베딩 생성 중 오류가 발생했습니다');
    } finally {
      setEmbedding(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPartnerName('');
    setRelationshipCategory('');
    setUploadProgress(0);
    setUploadResult(null);
    setUploadSuccess(false);
    setEmbeddingProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGoToChat = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.uploadCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>카카오톡 대화 업로드</h2>
            <p className={styles.subtitle}>
              카카오톡 대화 내용을 업로드하여 AI가 학습할 수 있도록 합니다
            </p>
          </div>

          {!uploadResult ? (
            <>
              {/* 파일 드롭존 */}
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''} ${
                  file ? styles.dropzoneHasFile : ''
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={!file ? handleBrowseClick : undefined}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />

                {!file ? (
                  <div className={styles.dropzoneContent}>
                    <div className={styles.uploadIcon}>📁</div>
                    <p className={styles.dropzoneText}>
                      카카오톡 대화 파일을 드래그하거나 클릭하여 선택하세요
                    </p>
                    <p className={styles.dropzoneHint}>.txt 파일만 지원됩니다</p>
                  </div>
                ) : (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>📄</div>
                    <div className={styles.fileDetails}>
                      <p className={styles.fileName}>{file.name}</p>
                      <p className={styles.fileSize}>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={handleRemoveFile}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* 상대방 정보 입력 */}
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>상대방 이름</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="상대방 이름을 입력하세요"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>관계 카테고리</label>
                  <select
                    className={styles.select}
                    value={relationshipCategory}
                    onChange={(e) => setRelationshipCategory(e.target.value)}
                    disabled={uploading}
                  >
                    <option value="">선택하세요</option>
                    {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className={styles.errorMessage}>
                  <span className={styles.errorIcon}>⚠️</span>
                  {error}
                </div>
              )}

              {/* 업로드 진행률 */}
              {uploading && (
                <div className={styles.progressSection}>
                  <p className={styles.progressText}>📤 업로드 중...</p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className={styles.progressPercent}>{uploadProgress}%</p>
                </div>
              )}

              {/* 업로드 성공 메시지 */}
              {uploadSuccess && (
                <div className={styles.successMessage}>
                  <span className={styles.successIcon}>✅</span>
                  <span>업로드 완료!</span>
                </div>
              )}

              {/* 임베딩 진행률 */}
              {embedding && (
                <div className={styles.embeddingSection}>
                  <div className={styles.embeddingHeader}>
                    <div className={styles.spinnerIcon}>🔄</div>
                    <div className={styles.embeddingTextContainer}>
                      <p className={styles.embeddingTitle}>AI 학습 진행 중</p>
                      <p className={styles.embeddingStage}>{embeddingStage}</p>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.embeddingProgressFill}
                      style={{ width: `${embeddingProgress}%` }}
                    />
                  </div>
                  <p className={styles.progressPercent}>{Math.round(embeddingProgress)}%</p>
                  <p className={styles.embeddingHint}>
                    💡 AI가 대화 패턴을 학습하고 있습니다. 잠시만 기다려주세요.
                  </p>
                </div>
              )}

              {/* 버튼 영역 */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.cancelButton}
                  onClick={() => navigate('/')}
                  disabled={uploading || embedding}
                >
                  취소
                </button>
                <button
                  className={styles.uploadButton}
                  onClick={handleUpload}
                  disabled={uploading || embedding || !file || !partnerName.trim() || !relationshipCategory}
                >
                  {uploading ? '업로드 중...' : embedding ? '처리 중...' : '업로드'}
                </button>
              </div>
            </>
          ) : (
            /* 업로드 완료 결과 */
            <div className={styles.resultSection}>
              <div className={styles.successIcon}>✅</div>
              <h3 className={styles.successTitle}>모든 작업이 완료되었습니다!</h3>

              <div className={styles.resultCard}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>상대방</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.partner_name || '알 수 없음'}
                  </span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>관계</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.relationship_category
                      ? RELATIONSHIP_LABELS[uploadResult.relationship_category]
                      : '미설정'}
                  </span>
                </div>
                <div className={styles.resultDivider} />
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>전체 메시지</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.total_messages ?? 0}개
                  </span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>내 메시지</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.my_messages_count ?? 0}개
                  </span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>상대 메시지</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.other_messages_count ?? 0}개
                  </span>
                </div>
                <div className={styles.resultDivider} />
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>말투 샘플 저장</span>
                  <span className={styles.resultValue}>
                    {uploadResult?.tone_samples_created ?? 0}개
                  </span>
                </div>
              </div>

              <div className={styles.resultButtons}>
                <button className={styles.resetButton} onClick={handleReset}>
                  다시 업로드
                </button>
                <button className={styles.chatButton} onClick={handleGoToChat}>
                  대화 시작하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoUploadPage;
