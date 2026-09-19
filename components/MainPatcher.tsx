// MainPatcher.tsx developed with Claude Sonnet 4
import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import DownloadRomButton from '@/components/DownloadRomButton';
import RomVerifier from '@/components/RomVerifier';
import CustomOptionsPanel from '@/components/CustomOptionsPanel';
import { applyIPS } from '@/lib/patcher';
import computeCRC32 from '@/lib/crc32';
import { useOptionalPatches } from '@/hooks/useOptionalPatches';
import PlusTitle from "@/components/TitleScreen";

type Patch = {
  name: string;
  data: Uint8Array;
  originalName: string; // filename without path
};

// Interface for ROM state mgmt
type RomState = {
  originalFile: File;
  processedRom: Uint8Array; // headerless ROM, NOT yet expanded
  matchingPatch: Patch;
  originalCRC32: string; // previously discrete state
};

// Patch names (matching the .ips filename, minus extension) that need the
// larger ROM. Anything not listed here runs at the 3MB default.
const EXPANDING_PATCH_NAMES: string[] = [
  'The Diary',
  'Advanced Diary',
];


// Mutually exclusive tags. Selecting a patch clears any other selected
// patch that shares a tag — across categories, not just within one.
// "Slots Menu" sits in both SLOTS groups, so it blocks the other two
// while those two can still be used together.
const EXCLUSIVE_GROUPS: Record<string, string[]> = {
  "The Diary": ["DIARY"],
  "Advanced Diary": ["DIARY"],
  "Vanilla New World": ["DIALOGUE"],
  "Italiano": ["DIALOGUE"],
  "Espanol": ["DIALOGUE"],
  "Slots Menu": ["SLOTS"],
  "Forgiving Slots": ["SLOTS"],
  "Chrono Trigger": ["WALLPAPER"],
  "SNES Collection": ["WALLPAPER"],
  "RPG Collection": ["WALLPAPER"],
  "Dealer's Choice": ["WALLPAPER"],
  "Legacy": ["PORTRAITS"],
  "Classic": ["PORTRAITS"],
  "Modern": ["PORTRAITS"],
  "Stylized": ["PORTRAITS"],
  "Full Body": ["PORTRAITS"],
  "Tactics": ["PORTRAITS"],
  "T-Edition Sprites": ["SPRITES"],
  "B-Side Sprites": ["SPRITES"],
  "Behold Pants!": ["SPRITES"],
  "Dragon Quest": ["MENU"],
  "Ghouls 'n Ghosts": ["MENU"],
  "Shin Megami Tensei": ["MENU"],
  "Star Ocean": ["MENU"],
  "Tales of Phantasia": ["MENU"],
  "Wild Arms": ["MENU"],
  "Final Fantasy 7": ["TEXT"],
  "Final Fantasy Tactics": ["TEXT"],
  "A Link to the Past": ["TEXT"],
  "Metroid": ["TEXT"],
  "Sea of Stars": ["TEXT"],
  "Super Mario RPG": ["TEXT"],
};

// Tags a patch needs before it can be selected. A tag counts as provided
// when some selected patch carries it in EXCLUSIVE_GROUPS above, so
// either Diary satisfies DIARY. Deselecting the Diary drops these.
const PATCH_REQUIRES: Record<string, string[]> = {
  "Dragon Quest": ["DIARY"],
  "Ghouls 'n Ghosts": ["DIARY"],
  "Shin Megami Tensei": ["DIARY"],
  "Star Ocean": ["DIARY"],
  "Tales of Phantasia": ["DIARY"],
  "Wild Arms": ["DIARY"],
  "Final Fantasy 7": ["DIARY"],
  "Final Fantasy Tactics": ["DIARY"],
  "A Link to the Past": ["DIARY"],
  "Metroid": ["DIARY"],
  "Sea of Stars": ["DIARY"],
  "Super Mario RPG": ["DIARY"],
};


// Links revealed under a patch once it is selected. MSU-1 soundtrack
// packs can't be hosted here, so these point at the originals.
const PATCH_LINKS: Record<string, {
  intro?: string;
  items: { label: string; href: string; yt?: string }[];
  noteTitle?: string;
  noteItems?: { label: string; href: string }[];
  howTo?: string;
}> = {
  "MSU-1 Custom Music": {
    howTo: [
      "How to set up custom music:",
      "",
      "1. Download and extract a soundtrack pack.",
      "2. Look at what the .pcm files are named. They will all share a base name followed by a number, like SomeName-1.pcm.",
      "3. Rename your patched ROM to that base name, keeping the .sfc extension. So SomeName-1.pcm means the ROM becomes SomeName.sfc.",
      "4. Rename the pack's .msu file to match as well: SomeName.msu.",
      "5. BNW also needs one extra song, the 'Four Fiends' track. Name it SomeName-37.pcm and put it in the same folder.",
      "6. Put the ROM, the .msu file and every .pcm file in the same folder.",
    ].join("\n"),
    intro: "Choose a soundtrack, then rename your patched ROM (and its .msu file) to match the pack's track names.",
    items: [
      { label: "Original Soundtrack",
        href: "https://d9z02nz0xcifk.cloudfront.net/DancingMad-OST.7z" },
      { label: "ChrystalChameleon's remasters",
        href: "https://d9z02nz0xcifk.cloudfront.net/DancingMad-CRC.7z",
        yt: "https://www.youtube.com/playlist?list=PLdYEU9SXADalemHUSvDg52eVpDalwzkBD" },
      { label: "Sean Schafianski — Final Fantasy VI Remaster",
        href: "https://d9z02nz0xcifk.cloudfront.net/DancingMad-SSC.7z",
        yt: "https://youtube.com/playlist?list=PLv3607Rzyj4jWhDSZbKy-n3TpqDty8ilW" },
      { label: "Final Fantasy Acoustic Rendition",
        href: "https://d9z02nz0xcifk.cloudfront.net/DancingMad-FFAR.7z",
        yt: "https://youtube.com/playlist?list=PLJSNlUwe_ilz2momglZW2l8-AWSCRsUZV" },
      { label: "OCRemix Balance & Ruin",
        href: "https://d9z02nz0xcifk.cloudfront.net/DancingMad-OCR.7z",
        yt: "https://www.youtube.com/playlist?list=PLWk40K1PeZwGckAnyxtnLDaYA6Us-dzuf" },
      { label: "Piano PCM Pack by edale",
        href: "https://mega.nz/file/HAp0kQwT#QA2-WGrK2KpMRkPrdpKludpkYXL_iXR4MBjAZYPExXU",
        yt: "https://www.youtube.com/watch?v=J5mOs7O1dvg" },
      { label: "Final Fantasy VI (Pixel Remaster) PCMs by Brutapode",
        href: "https://mega.nz/file/wOABQILL#9nRRGBcEGG6cQmCSDUoGyS4l1nhmEuFlg2MJFOiB-wg",
        yt: "https://www.youtube.com/watch?v=YUk4ai6krwU" },
      { label: "Synthetic Origins PCM Pack by edale",
        href: "https://mega.nz/file/3JAVhZZB#9tjKzhNC7mNVJb2dsvllvfbmuHi73GW8On5uCIPP66Q",
        yt: "https://www.youtube.com/playlist?list=PLNRafIhbJER0M8imkJKCphnNoCYpZF08j" },
    ],
    noteTitle: "BNW also needs one of these 'Four Fiends' tracks. Rename it to SomeName-37.pcm, matching the rest of your set:",
    noteItems: [
      { label: "Metal",
        href: "https://mega.nz/file/eEg0RDrb#RFqDE7MXfx6TQV-RTmWnk98I5SY0GWk5mBZKMmqcjFA" },
      { label: "Synthetic Origins",
        href: "https://mega.nz/file/2dxmjb7I#GouwzyB53KKnKu6lXq8MytwALu7UPiO7RA1zHAplGsM" },
      { label: "Pixel Remaster",
        href: "https://mega.nz/file/fEAAAZjL#_n6i5gjLkqwiCfgOHO_8vtH33AQPjkYRN3Sf_1vw86A" },
    ],
  },
};


// A screenshot shown under a category heading. Swaps to the selected
// patch's own preview once one is chosen, so the picture always shows
// what the player will actually get.
// Keyed by exclusive tag, not by category: Sprites & Graphics also holds
// untagged extras like Alternative Dadaluma, and selecting one of those
// shouldn't change the sprite-set preview.
// Categories whose option boxes drop the Information button. The category
// preview above them already shows the font, so the popup added nothing.
const HIDE_INFO_IN: string[] = [
  "wallpapers",
  "menu-fonts",
  "dialogue-fonts",
];

const CATEGORY_PREVIEWS: Record<string, { tag: string; image: string }> = {
  "wallpapers":      { tag: "WALLPAPER", image: "/previews/default_wallpaper.png" },
  "portraits":       { tag: "PORTRAITS", image: "/previews/default_portraits.png" },
  "sprites":         { tag: "SPRITES",   image: "/previews/default_sprites.png" },
  "menu-fonts":      { tag: "MENU",      image: "/previews/default_menufont.png" },
  "dialogue-fonts":  { tag: "TEXT",      image: "/previews/default_dialoguefont.png" },
};

// Selecting every one of these flips the page into "Brave New Hell":
// the title changes and the background fades red. Deselecting any one
// of them reverts it.
const HELL_MODE_PATCHES: string[] = [
  "New Game Plus",
  "Frontier Challenge",
  "Hard Mode",
];

const BASE_ROM_MB = 3;
const EXPANDED_ROM_MB = 4;

interface MainPatcherProps {
  // Told whether every HELL_MODE_PATCHES entry is currently selected, so
  // the page can retitle itself and recolour.
  onHellModeChange?: (active: boolean) => void;
}

export default function MainPatcher({ onHellModeChange }: MainPatcherProps) {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [romState, setRomState] = useState<RomState | null>(null); // Stores ROM + patch info
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPatches, setLoadingPatches] = useState(true);
  const [selectedOptionalPatches, setSelectedOptionalPatches] = useState<string[]>([]);

  // Optional patches by category
  const optionalPatchesConfig = useMemo(() => ({
    categories : [
      {
        id: 'expansion',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "The Diary",
          "Advanced Diary"
        ],
        title: 'Diary Expansion',
        description: 'Adds the in-game Diary. This will expand the ROM size to 4MB and will enable optional font patches.',
        allowMultiple: false,
        zipFile: 'Expansion.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'dialogue',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "Vanilla New World",
          "Italiano",
          "Espanol",
          "notext"
        ],
        title: 'Dialogue',
        description: 'Alternate scripts and translations.',
        // true, not false: the three translations are kept mutually
        // exclusive by their DIALOGUE tag, while notext carries no tag
        // and can be combined with any of them.
        allowMultiple: true,
        zipFile: 'Dialogue.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'accessibility',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
		  "Multitap Support",
          "Blitz and Bushido Menus",
          "Forgiving Slots",
          "Slots Menu",
          "Slow Backgrounds"
        ],
        title: 'Accessibility',
        description: 'Options to ease gameplay and increase accessibility. In some cases, multiple options can be selected.',
        allowMultiple: true,
        zipFile: 'Accessibility.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'gameplay',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "New Game Plus",
          "Frontier Challenge",
          "Hard Mode"
        ],
        title: 'Gameplay',
        description: 'Options to increase the difficulty of gameplay. Multiple options can be selected.',
        allowMultiple: true,
        zipFile: 'Gameplay.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'sprites',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "T-Edition Sprites",
          "B-Side Sprites",
          "Behold Pants!",
          "Vanilla Zombies",
          "Altered Bosses"
        ],
        title: 'Sprites & Graphics',
        description: 'Alternative character sprites and graphical swaps. In some cases, multiple options can be selected.',
        allowMultiple: true,
        zipFile: 'Character Sprites and Graphics.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'portraits',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "Legacy",
          "Classic",
          "Modern",
          "Stylized",
          "Full Body",
          "Tactics"
        ],
        title: 'Character Portraits',
        description: 'Alternative character portraits, as seen in the main menu.',
        allowMultiple: false,
        zipFile: 'Character Portraits.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'wallpapers',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "Chrono Trigger",
          "SNES Collection",
          "RPG Collection",
          "Dealer's Choice"
        ],
        title: 'Wallpapers',
        description: 'Alternative text box backgrounds.',
        allowMultiple: false,
        zipFile: 'Wallpapers.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'dialogue-fonts',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "Final Fantasy 7",
          "Final Fantasy Tactics",
          "A Link to the Past",
          "Metroid",
          "Sea of Stars",
          "Super Mario RPG"
        ],
        title: 'Dialogue Font',
        description: 'These alternative fonts require the Diary expansion.',
        allowMultiple: false,
        zipFile: 'Dialogue Fonts - Requires Diary Expansion.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'menu-fonts',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "Dragon Quest",
          "Ghouls 'n Ghosts",
          "Metroid Menu",
          "Shin Megami Tensei",
          "Star Ocean",
          "Tales of Phantasia",
          "Wild Arms"
        ],
        title: 'Menu Font',
        description: 'These alternative fonts require the Diary expansion.',
        allowMultiple: false,
        zipFile: 'Menu Fonts - Requires Diary Expansion.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      },
      {
        id: 'music',
        // Display order. Rearrange these lines to reorder the boxes.
        order: [
          "MSU-1 Custom Music"
        ],
        title: 'Music',
        description: 'MSU-1 custom soundtrack support.',
        allowMultiple: false,
        zipFile: 'Music.zip',
        defaultChoice: '',
        hasManifest: true,
        manifestPath: (patchName: string) => `/manifests/${patchName}.txt`
      }
    ]
  }), []);

  const {
    categories: optionalCategories,
    loading: loadingOptional,
    error: optionalError,
    getSelectedPatches
  } = useOptionalPatches(optionalPatchesConfig);

  // name of the core romhack patches' zip
  const corePatches = '/FF6BNW.zip'

  useEffect(() => {
    // Loads main patches
    const loadPatches = async () => {
      try {
        setLoadingPatches(true);
        const response = await fetch(corePatches);
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        const patchEntries: Patch[] = [];

        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            
            if (file.dir || !file.name.toLowerCase().endsWith('.ips')) {
              return; // filtered for patch files only
            }
            
            try {
              const originalName = file.name.split('/').pop() || file.name; // rm path
              const data = new Uint8Array(await file.async('arraybuffer')); // convert to raw Uint8Array
              
              const header = new TextDecoder().decode(data.slice(0, 5)); // verifies ips header ("PATCH")
              if (header !== 'PATCH') {
                console.warn(`Skipping invalid IPS file: ${file.name} (invalid header: ${header})`);
                return;
              }
              
              const nameWithoutExtension = originalName.replace(/\.ips$/i, '').toUpperCase(); // case mgmt for CRC32 matching
              
              patchEntries.push({ 
                name: nameWithoutExtension, 
                data,
                originalName
              });
              
              console.log(`Loaded patch: ${nameWithoutExtension} from ${originalName}`);
            } catch (err) {
              console.error(`Error processing patch file ${file.name}:`, err);
            }
          })
        );

        console.log(`Successfully loaded ${patchEntries.length} main project patches`);
        setPatches(patchEntries);
      } catch (err) {
        console.error('Failed to load main patches:', err);
        setError('Failed to load main patch files.');
      } finally {
        setLoadingPatches(false);
      }
    };

    loadPatches(); // kicks off the main rendering logic   
  }, []);



  // Detects & removes SMC/SFC copier header if present
  const removeHeaderIfPresent = (romData: Uint8Array): Uint8Array => {
    if (romData.length % 1024 === 512) { // copier header is always 512 bytes
      console.log('ROM copier header detected, removing 512 bytes');
      return romData.slice(512);
    }
    return romData;
  };

  // Validates & prepares ROM
  const handleMatch = async (romFile: File) => {
    setIsPatching(true);
    setError(null);
    setRomState(null);

    try {
      // Loads ROM bytes
      const arrayBuffer = await romFile.arrayBuffer();
      const romBytes = new Uint8Array(arrayBuffer); // needed for specificity in Type
      // Checks, removes header if present
      const headerlessRom = removeHeaderIfPresent(romBytes);
      // Calculates original ROM CRC32
      const romCRC32 = computeCRC32(headerlessRom);
      console.log(`ROM CRC32: ${romCRC32}`); // debug log

      // Finds matching main patch by CRC32
      const matchingPatch = patches.find(patch => patch.name === romCRC32);
      if (!matchingPatch) {
        throw new Error(
          `You need an unmodified Final Fantasy III (US) v1.0 or v1.1 ROM.`
        );
      }
      console.log(`Found matching patch: ${matchingPatch.originalName}`);

      // NOTE: expansion happens in generatePatchedRom, not here — the
      // target size depends on which optional patches are selected, and
      // nothing is selected yet at upload time.
      setRomState({
        originalFile: romFile,
        processedRom: headerlessRom,
        matchingPatch: matchingPatch,
        originalCRC32: romCRC32
      });

      console.log('ROM validated and ready for patching');
    } catch (err: any) {
      // warn, not error: a wrong ROM is normal user input, and Next's dev
      // overlay opens on console.error
      console.warn('ROM validation failed:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsPatching(false);
    }
  };

  // Generates patched ROM (called by DownloadRomButton)
  const generatePatchedRom = async (): Promise<Uint8Array> => {
    if (!romState) {
      throw new Error('No ROM loaded');
    }
    console.log('Generating patched ROM...');

    // Applies optional patches (in order of selection)
    const selectedOptionals = getSelectedPatches(selectedOptionalPatches);

    // 3MB unless a selected patch needs the larger ROM, then 4MB.
    const needsExpansion = selectedOptionals.some(p =>
      EXPANDING_PATCH_NAMES.includes(p.name)
    );
    const targetMB = needsExpansion ? EXPANDED_ROM_MB : BASE_ROM_MB;
    const targetBytes = targetMB * 1024 * 1024;
    console.log(`Target ROM size: ${targetMB}MB (expansion ${needsExpansion ? 'required' : 'not required'})`);

    // Annotated, not inferred: `new Uint8Array(...)` infers the narrow
    // Uint8Array<ArrayBuffer>, while applyIPS returns the wide
    // Uint8Array<ArrayBufferLike> (TS 5.7+ made typed arrays generic over
    // their buffer). Without this the reassignments below fail to compile.
    let patchedRom: Uint8Array = new Uint8Array(romState.processedRom);
    if (patchedRom.length < targetBytes) {
      const resized = new Uint8Array(targetBytes);
      resized.set(patchedRom);
      patchedRom = resized;
    }

    // Applies main patch
    patchedRom = applyIPS(patchedRom, romState.matchingPatch.data as Uint8Array);
    console.log(`Applied main patch: ${romState.matchingPatch.originalName}`);
    for (const optionalPatch of selectedOptionals) {
      console.log(`Applying optional patch: ${optionalPatch.name}`);
      patchedRom = applyIPS(patchedRom, optionalPatch.data);
    }
    console.log(`Final patched ROM generated with ${selectedOptionals.length} optional patches`);
    return patchedRom;
  };

  // Report Hell Mode to the page. Names are compared rather than ids
  // because ids carry the category prefix.
  useEffect(() => {
    if (!onHellModeChange) return;
    const selectedNames = getSelectedPatches(selectedOptionalPatches).map(p => p.name);
    const active = HELL_MODE_PATCHES.every(n => selectedNames.includes(n));
    onHellModeChange(active);
  }, [selectedOptionalPatches, optionalCategories, onHellModeChange]);

  // Control checks
  const hasValidRom = romState !== null;
  const isReady = !loadingPatches && patches.length > 0;
  const hasOptionalPatches = optionalCategories.length > 0;
  
  return (
  <>
    {/* Centred hero: title screenshot + intro copy */}
    <div className="patcher-hero">
      <PlusTitle />
      <p className="text-center mb-2">
        Upload your FFIII ROM file to create a copy of FF6: BNW.<br/>
        Customize your experience with additional options below.
      </p>
    </div>

    {/* Upload on the left, download on the right */}
    <div className="two-column-layout">
      <div className='d-flex justify-content-center align-items-center h-100'>
        {loadingPatches ? (
          <p>Loading main patches...</p>
        ) : isReady ? (
          <RomVerifier onMatch={handleMatch} errorMessage={error} />
        ) : (
          <p className="text-danger">No patches could be loaded. Please refresh the page.</p>
        )}
      </div>

      <div className='d-flex justify-content-center align-items-center h-100'>
        <DownloadRomButton
          onGenerateRom={generatePatchedRom} // Now uses generator function
          filename={`FF6_BNW_v3.0${selectedOptionalPatches.length > 0 ? '_Custom' : ''}.sfc`}
          disabled={!hasValidRom || isPatching}
        />
      </div>
    </div>
{/* Optional Patches Panel */}
    <div className='d-flex justify-content-center align-items-center h-100'>
      {isReady && hasOptionalPatches && (
        <CustomOptionsPanel
          categories={optionalCategories}
          selectedPatches={selectedOptionalPatches}
          onSelectionChange={setSelectedOptionalPatches}
          isDisabled={isPatching || !hasValidRom}
          patchLinks={PATCH_LINKS}
          categoryPreviews={CATEGORY_PREVIEWS}
          hideInfoIn={HIDE_INFO_IN}
          exclusiveGroups={EXCLUSIVE_GROUPS}
          requires={PATCH_REQUIRES}
          lockedPatchNames={[
            "Advanced Diary",
            "notext",
            "New Game Plus",
            "Frontier Challenge",
            "Hard Mode",
          ]}
        />
      )}
      {/* Loading state for optional patches */}
      {loadingOptional && (
        <p className="text-gray-400 text-sm">Loading optional patches...</p>
      )}
      {/* ROM errors are shown inside the drop box instead */}
      {optionalError && <p className="text-yellow-500 font-medium">Optional patches: {optionalError}</p>}
      
      {/* ROM Information */}
      {hasValidRom && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl mb-2">ROM Ready:</h2>
          <p className="font-mono text-sm">
            Uploaded CRC32: {romState!.originalCRC32}
          </p>
          {/* <p className="text-sm text-gray-300">
            Matching patch: {romState!.matchingPatch.originalName}
          </p> */}
          {selectedOptionalPatches.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-300">Selected options:</p>
              <ul className="text-xs text-gray-400 mt-1">
                {getSelectedPatches(selectedOptionalPatches).map(patch => (
                  <li key={patch.id}>{patch.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isPatching && <SpinnerOverlay />}
    </div>
  </>
  );
}
