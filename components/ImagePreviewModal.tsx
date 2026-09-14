// code authored by Claude Sonnet 4
import React, { useEffect, useState } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  imageAlt: string;
  title?: string;
  description?: string;
  manifestPath?: string; // optional path to manifest file
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  src,
  imageAlt,
  title,
  manifestPath
}) => {
  const [manifestContent, setManifestContent] = useState<string | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestError, setManifestError] = useState(false);

  // Load manifest content when modal opens and manifestPath is provided
  useEffect(() => {
    if (!isOpen || !manifestPath) {
      setManifestContent(null);
      setManifestError(false);
      return;
    }

    const loadManifest = async () => {
      setLoadingManifest(true);
      setManifestError(false);

      try {
        const response = await fetch(manifestPath);
        if (!response.ok) {
          throw new Error(`${manifestPath} returned HTTP ${response.status}`);
        }
        const text = await response.text();
        console.log(`Manifest loaded: ${manifestPath} (${text.length} chars)`);
        setManifestContent(text);
      } catch (error) {
        console.warn('No manifest shown:', error);
        setManifestError(true);
        setManifestContent(null);
      } finally {
        setLoadingManifest(false);
      }
    };

    loadManifest();
  }, [isOpen, manifestPath]);

  // ESC to close, and lock background scrolling while open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasManifest = manifestPath && !manifestError;

  return (
    // Clicking anywhere closes, including the card itself.
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container">
        <div className="modal-body">
          <div className="modal-image-container">
            <img
              src={src}
              alt={imageAlt}
              className="modal-image"
              onError={(e) => {
                console.error('Failed to load preview image:', src);
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          </div>

          <div className="modal-text">
            {title && <h2 className="modal-title">{title}</h2>}

            {hasManifest && (
              loadingManifest ? (
                <p className="modal-loading">Loading…</p>
              ) : manifestContent ? (
                // Rendered as one block with white-space: pre-wrap, not
                // split into a div per line. Those divs sat inside <main>
                // and picked up its flex-column-centred rule, which
                // centred every line and collapsed the blank ones.
                <p className="manifest-text">{manifestContent}</p>
              ) : null
            )}
          </div>
        </div>

        <p className="modal-hint">Click anywhere to close</p>
      </div>

      <style jsx>{`
        /* Rules below re-declare width, min-width and flex-direction on
           purpose. The global stylesheet forces every div inside main to
           full width in a column, which otherwise stretches this card to
           fill the viewport and stacks its columns. */
        .modal-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          min-width: 0;
          flex-direction: row;
          background-color: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 8999;
          padding: 24px;
          box-sizing: border-box;
          cursor: pointer;
        }

        .modal-container {
          position: relative;
          width: auto;
          min-width: 0;
          background: linear-gradient(#241633, #1a0f26);
          border: 2px solid #7c3aed;
          border-radius: 12px;
          box-shadow: 0 0 30px 4px rgba(124, 58, 237, 0.35);
          padding: 22px;
          width: auto;
          max-width: min(900px, 92vw);
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-body {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 22px;
          min-height: 0;
          width: auto;
          min-width: 0;
        }

        .modal-image-container {
          flex: 0 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          width: auto;
          min-width: 0;
        }

        /* Native size where it fits, capped so it never dominates.
           Pixelated to match the rest of the site's SNES art. */
        .modal-image {
          display: block;
          max-width: 480px;
          max-height: 70vh;
          width: auto;
          height: auto;
          image-rendering: auto;
          border: 3px solid #facc15;
          border-radius: 4px;
          background: #000;
        }

        .modal-text {
          flex: 1 1 auto;
          min-width: 260px;
          width: 320px;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          /* auto, not scroll: the bar only appears if the blurb is long */
          overflow-y: auto;
          max-height: 70vh;
        }

        .modal-title {
          margin: 0;
          color: #e9d5ff;
          font-size: 1.2rem;
          line-height: 1.3;
        }

        .manifest-text {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          margin: 0;
          text-align: left;
          color: #ddd0f0;
          font-size: 0.8rem;
          line-height: 1.5;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .modal-loading {
          color: #c4b5fd;
          font-size: 0.85rem;
        }

        .modal-hint {
          margin: 0;
          text-align: center;
          color: #8b7aa8;
          font-size: 0.8rem;
        }

        /* Thin, dark scrollbar for the rare long blurb */
        .modal-text::-webkit-scrollbar {
          width: 6px;
        }
        .modal-text::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-text::-webkit-scrollbar-thumb {
          background: #4c1d95;
          border-radius: 3px;
        }

        @media (max-width: 700px) {
          .modal-body {
            flex-direction: column;
            align-items: center;
          }
          .modal-image {
            max-width: 100%;
            max-height: 40vh;
          }
          .modal-text {
            max-width: 100%;
            max-height: 30vh;
          }
        }
      `}</style>
    </div>
  );
};

export default ImagePreviewModal;
