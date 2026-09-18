// CustomOptionsPanel.tsx
// code co-authored by Claude Sonnet 4
import React, { useState } from 'react';
import ImagePreviewModal from './ImagePreviewModal';
import { usePasswordUnlock, PasswordForm } from './PasswordGate';

export interface OptionalPatch {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: Uint8Array;
  category?: string;
  defaultChoice?: string;
  previewImage?: string;
}

export interface PatchLinkItem {
  label: string;
  href: string;
  yt?: string;       // optional YouTube playlist for the same pack
}

export interface PatchLinkSection {
  howTo?: string;
  intro?: string;
  items: PatchLinkItem[];
  noteTitle?: string;
  noteItems?: PatchLinkItem[];
}

export interface PatchCategory {
  id: string;
  title: string;
  description?: string;
  patches: OptionalPatch[];
  allowMultiple?: boolean; // If false, radio button behavior; if true, checkbox behavior
  defaultChoice?: string; // styling feature for baseline options, only one per category
}

interface CustomOptionsPanelProps {
  categories: PatchCategory[];
  selectedPatches: string[]; // Array of patch IDs
  onSelectionChange: (selectedPatchIds: string[]) => void;
  onPreviewImage?: (imageSrc: string, title: string, description: string) => void;
  isDisabled?: boolean;
  lockedPatchNames?: string[]; // patch.name values that need the password
  // patch name -> exclusive group tags. Selecting one clears any other
  // selected patch sharing a tag, across categories.
  // patch name -> extra links revealed once that patch is selected
  patchLinks?: Record<string, PatchLinkSection>;
  // category id -> { exclusive tag that drives the preview, default image }
  categoryPreviews?: Record<string, { tag: string; image: string }>;
  // category ids whose boxes hide the Information button - useful where the
  // category preview already shows what the patch does
  hideInfoIn?: string[];
  exclusiveGroups?: Record<string, string[]>;
  // patch name -> tags it needs. A tag is satisfied when some selected
  // patch carries that tag in exclusiveGroups.
  requires?: Record<string, string[]>;
}

const CustomOptionsPanel: React.FC<CustomOptionsPanelProps> = ({
  categories,
  selectedPatches,
  onSelectionChange,
  isDisabled = false,
  lockedPatchNames = [],
  exclusiveGroups = {},
  requires = {},
  patchLinks = {},
  categoryPreviews = {},
  hideInfoIn = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [promptingFor, setPromptingFor] = useState<string | null>(null);
  const [modalProps, setModalProps] = useState<{
    src: string;
    title: string;
    description: string;
    manifestPath: string;
  } | null>(null);

  const expectedHash = process.env.NEXT_PUBLIC_CUSTOM_OPTIONS_HASH ?? '';
  const { unlocked, attempt } = usePasswordUnlock(expectedHash);

  const handlePreviewClick = (patch: OptionalPatch) => {
    // Always look for a manifest. The modal hides the text panel by itself
    // when the fetch 404s, so there's no list of category ids to keep in
    // sync here — the old one still named categories that no longer exist.
    const manifestPath = `/manifests/${patch.name}.txt`;

    setModalProps({
      src: patch.previewImage ?? '/placeholder-image.png',
      title: patch.name,
      description: patch.description,
      manifestPath: manifestPath
    });
    setModalOpen(true);
  };

  const allPatches = categories.flatMap(cat => cat.patches);
  const nameOf = (id: string) => allPatches.find(p => p.id === id)?.name ?? '';

  // Tags currently provided by a selection.
  const tagsProvidedBy = (ids: string[]) => {
    const tags = new Set<string>();
    ids.forEach(id => (exclusiveGroups[nameOf(id)] ?? []).forEach(t => tags.add(t)));
    return tags;
  };

  // Drop any selected patch whose required tags are no longer present.
  // Loops because removing one dependent can invalidate another.
  const pruneUnsatisfied = (ids: string[]) => {
    let current = ids;
    for (;;) {
      const provided = tagsProvidedBy(current);
      const kept = current.filter(id => {
        const needed = requires[nameOf(id)] ?? [];
        return needed.every(tag => provided.has(tag));
      });
      if (kept.length === current.length) return kept;
      current = kept;
    }
  };

  const isSatisfied = (patch: OptionalPatch) => {
    const needed = requires[patch.name] ?? [];
    if (needed.length === 0) return true;
    const provided = tagsProvidedBy(selectedPatches);
    return needed.every(tag => provided.has(tag));
  };

  const handlePatchToggle = (patchId: string, categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const patchName = nameOf(patchId);
    const alreadyOn = selectedPatches.includes(patchId);
    let newSelection = [...selectedPatches];

    if (alreadyOn) {
      newSelection = newSelection.filter(id => id !== patchId);
    } else {
      if (!category.allowMultiple) {
        // Radio behaviour within the category
        const categoryPatchIds = category.patches.map(p => p.id);
        newSelection = newSelection.filter(id => !categoryPatchIds.includes(id));
      }

      // Clear anything sharing an exclusive tag with this patch
      const myTags = exclusiveGroups[patchName] ?? [];
      if (myTags.length) {
        newSelection = newSelection.filter(id => {
          const theirTags = exclusiveGroups[nameOf(id)] ?? [];
          return !theirTags.some(t => myTags.includes(t));
        });
      }

      newSelection.push(patchId);
    }

    onSelectionChange(pruneUnsatisfied(newSelection));
  };

  const isPatchSelected = (patchId: string) => selectedPatches.includes(patchId);
  const getSelectedCount = () => selectedPatches.length;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">

      <div className="options-toggle">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="options-toggle-btn"
        >
          {isExpanded ? 'Hide Optional Patches' : 'Click for Optional Patches'}
        </button>
        {/* Always rendered, so the layout doesn't shift on first selection */}
        <span className="options-count">
          {getSelectedCount() > 0 ? `${getSelectedCount()} selected` : 'None selected'}
        </span>
      </div>

      {/* Options Panel */}
      {isExpanded && (
        <div className="">
          <div className="p-3 m-2">
            {categories.map((category) => (
              <div key={category.id} className="category-block">
                <h3 className="category-title">
                  <span>{category.title}</span>
                </h3>

                {category.description && (
                  <p className="category-description">
                    {category.description}
                  </p>
                )}

                {categoryPreviews[category.id] && (() => {
                  const { tag, image } = categoryPreviews[category.id];
                  // Only a patch carrying this category's exclusive tag
                  // changes the preview; untagged extras don't.
                  const chosen = category.patches.find(p =>
                    selectedPatches.includes(p.id) &&
                    (exclusiveGroups[p.name] ?? []).includes(tag)
                  );
                  return (
                    <div className="category-preview">
                      <img
                        src={chosen?.previewImage ?? image}
                        alt={chosen ? chosen.name : `${category.title} default`}
                        onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }}
                      />
                    </div>
                  );
                })()}

                <div className="option-grid">

                  {category.patches.map((patch) => {
                    const isDefaultPatch = category.defaultChoice === patch.name;
                    const isSelected = isPatchSelected(patch.id);
                    const isLockedPatch = lockedPatchNames.includes(patch.name);
                    const isLocked = isLockedPatch && !unlocked;
                    const depMet = isSatisfied(patch);
                    const isPrompting = promptingFor === patch.id;
                    const classes = [
                      'p-2', 'd-flex', 'flex-column', 'option-box',
                      isSelected ? 'chosen-box' : 'unchosen-box',
                      isDefaultPatch ? 'default-option' : '',
                      isLocked ? 'locked-box' : '',
                      !depMet ? 'dep-locked' : '',
                      isDisabled ? 'cursor-not-allowed opacity-50' : ''
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={patch.id}
                        className={classes}
                      >
                        <div className="option-head">
                          <div className="font-medium text-white">
                            {patch.name}
                          </div>
                          {/* Always rendered for locked patches, so the box
                              keeps its height once unlocked. */}
                          {isLockedPatch && (
                            <div className={unlocked ? 'locked-note unlocked-note' : 'locked-note'}>
                              {unlocked ? 'Unlocked!' : 'Beat BNW to Unlock'}
                            </div>
                          )}
                        </div>

                        {isLocked ? (
                          isPrompting ? (
                            <PasswordForm
                              onAttempt={async (candidate) => {
                                const ok = await attempt(candidate);
                                if (ok) {
                                  // Close the form and select the patch the
                                  // user was trying to unlock.
                                  setPromptingFor(null);
                                  handlePatchToggle(patch.id, category.id);
                                }
                                return ok;
                              }}
                              onCancel={() => setPromptingFor(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPromptingFor(patch.id)}
                              disabled={isDisabled}
                              className="option-btn"
                            >
                              Password
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePatchToggle(patch.id, category.id)}
                            disabled={isDisabled || !depMet}
                            aria-pressed={isSelected}
                            className="option-btn"
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        )}

                        {/* Preview button, loaded from public/previews.
                            Hidden while the password form is open, and while
                            the patch is still locked - the taller Password
                            button above takes up the same room, so the box
                            keeps its height either way. */}
                        {/* Invisible stand-in for the hidden Information
                            button. Keeping the element in the layout - rather
                            than computing a taller Password button - means a
                            locked box is exactly as tall as an unlocked one,
                            whatever the text above does. */}
                        {patch.previewImage && !isPrompting && isLocked
                          && !hideInfoIn.includes(category.id) && (
                          <button
                            type="button"
                            className="option-btn option-btn-ghost"
                            aria-hidden="true"
                            tabIndex={-1}
                          >
                            Information
                          </button>
                        )}

                        {patch.previewImage && !isPrompting && !isLocked
                          && !hideInfoIn.includes(category.id) && (
                          <button
                            type="button"
                            onClick={() => handlePreviewClick(patch)}
                            disabled={isDisabled}
                            className="option-btn"
                          >
                            Information
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Extra links for any selected patch in this category */}
                {category.patches
                  .filter(p => selectedPatches.includes(p.id) && patchLinks[p.name])
                  .map(p => {
                    const section = patchLinks[p.name];
                    return (
                      <div key={`links-${p.id}`} className="patch-links">
                        {section.howTo && (
                          <p className="patch-links-howto">{section.howTo}</p>
                        )}
                        {section.intro && (
                          <p className="patch-links-intro">{section.intro}</p>
                        )}
                        <ul className="patch-links-list">
                          {section.items.map(item => (
                            <li key={item.href}>
                              <a href={item.href} target="_blank" rel="noopener noreferrer">
                                {item.label}
                              </a>
                              {item.yt && (
                                <a
                                  href={item.yt}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="patch-links-yt"
                                >
                                  playlist
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                        {section.noteTitle && (
                          <p className="patch-links-note">{section.noteTitle}</p>
                        )}
                        {section.noteItems && (
                          <ul className="patch-links-list">
                            {section.noteItems.map(item => (
                              <li key={item.href}>
                                <a href={item.href} target="_blank" rel="noopener noreferrer">
                                  {item.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                {category.patches.length === 0 && (
                  <p className="text-gray-400 italic">No options available in this category.</p>
                )}
              </div>
            ))}
          </div>

          {/* Clear All Button */}
          {getSelectedCount() > 0 && (
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => onSelectionChange([])}
                disabled={isDisabled}
                className="mx-auto px-2 py-2 text-white nicer-btn"
              >
                Clear All Selections
              </button>
            </div>
          )}

          {modalOpen && modalProps && (
            <ImagePreviewModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              src={modalProps.src}
              imageAlt={modalProps.title}
              title={modalProps.title}
              manifestPath={modalProps.manifestPath}
            />
          )}

        </div>
      )}
    </div>
  );
};

export default CustomOptionsPanel;
