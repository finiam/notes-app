import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import NoteTags from "./note-tags";
import NoteBody from "./note-body";
import { useStore } from "../lib/store";
import slugify from "../lib/utils/slugify";
import EditSVG from "../assets/edit.svg";
import TagsSVG from "../assets/tags.svg";
import TrashSVG from "../assets/trash.svg";
import SaveSVG from "../assets/save.svg";
import ShareSVG from "../assets/share.svg";
import BackSVG from "../assets/back.svg";
import { encryptData } from "../lib/utils/crypto";
import { NoteType, PublicNoteType } from "..";

export default function NoteEditor() {
  const {
    user: { signedKey, userSig },
    userNotes: { updateNote, removeNote },
    userPublicNotes: {
      publicNotes,
      removePublicNote,
      updatePublicNote,
      addPublicNote,
    },
    session: { openNote, setOpenNote, setStatus },
  } = useStore();
  const prevNote = useRef<NoteType | null>();
  const [editNote, setEditNote] = useState<boolean>(false);
  const [editTags, setEditTags] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [updateName, setUpdateName] = useState<boolean>(false);
  const [updateContent, setUpdateContent] = useState<boolean>(false);
  const [updateTags, setUpdateTags] = useState<boolean>(false);

  const resetState = () => {
    setEditNote(false);
    setEditTags(false);
    setName("");
    setContent("");
    setTags("");
    setUpdateName(false);
    setUpdateContent(false);
    setUpdateTags(false);
  };

  useEffect(() => {
    if (prevNote.current) saveNote(prevNote.current);

    resetState();

    if (!openNote) return;

    setName(openNote.name);

    if (openNote.content) setContent(openNote.content);

    if (openNote.tags) setTags(openNote.tags);

    prevNote.current = openNote;
  }, [openNote?.id]);

  useEffect(() => {
    const handleKeyDown = async (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "e") {
        ev.preventDefault();
        toggleEditNote();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (openNote) saveNote(openNote);
  };

  async function saveNote(note: NoteType) {
    if (!updateName && !updateContent && !updateTags) return;

    setStatus("loading", "Saving...");

    const updatedNote = {
      name,
      slug: slugify(name),
      content,
      tags,
    };

    const update = await updateNote(note.id, updatedNote, signedKey);

    if (update) {
      setStatus("ok", "Saved note");

      if (openNote?.id === note.id) {
        setOpenNote({
          ...openNote,
          content: updatedNote.content,
          tags: updatedNote.tags,
          name: updatedNote.name,
          slug: updatedNote.slug,
        });
      }
    } else {
      setStatus("error", "Something went wrong");
    }

    setUpdateName(false);
    setUpdateContent(false);
    setUpdateTags(false);
  }

  const deleteNote = async () => {
    if (!openNote) return;

    setStatus("loading", "Removing...");

    const remove = await removeNote(openNote.id);

    if (!remove) setStatus("error", "Something went wrong");

    setStatus("ok", "Removed note");

    const publicNote = publicNotes.find(
      (note) => note.originalNote === openNote.id,
    );

    if (publicNote) removePublicNote(publicNote.id);

    setOpenNote(null);
  };

  const handleNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);

    if (!updateName) setUpdateName(true);
  };

  const handleContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(ev.target.value);

    if (!updateContent) setUpdateContent(true);
  };

  const handleTagChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setTags(ev.target.value);

    if (!updateTags) setUpdateTags(true);
  };

  function toggleEditNote() {
    if (!editNote) setEditTags(false);

    setEditNote((prevEditNote) => !prevEditNote);
  }

  const toggleEditTags = async () => {
    if (!openNote) return;

    if (!editTags) setEditNote(false);

    setEditTags((prevEditTags) => !prevEditTags);
  };

  const handleShare = async () => {
    if (!openNote) return;

    await saveNote(openNote);

    setStatus("loading", "Generating URL...");

    const publicKey = uuidv4();
    const newPublicNote = {
      name: encryptData(name, publicKey),
      content: encryptData(content, publicKey),
      tags: encryptData(tags, publicKey),
    };

    const publicNote = publicNotes.find(
      (note) => note.originalNote === openNote.id,
    );

    let note: PublicNoteType | undefined;

    if (publicNote) {
      note = await updatePublicNote(publicNote.id, newPublicNote);
    } else {
      note = await addPublicNote({
        ...newPublicNote,
        originalNote: openNote.id,
        user: userSig,
      });
    }

    if (!note) {
      setStatus("error", "Something went wrong");

      return;
    }

    const noteURL = `${window.location.protocol}//${window.location.host}/note/${note.id}?key=${publicKey}`;

    navigator.clipboard.writeText(noteURL);
    setStatus("ok", "URL copied");
  };

  const closeNote = () => setOpenNote(null);

  return (
    <div className="h-screen w-full">
      {openNote && (
        <form
          onSubmit={handleSubmit}
          className="grid h-full grid-rows-[auto,_1fr] sm:grid-rows-[4.5rem,_1fr]"
        >
          <div className="grid h-full grid-cols-[1fr,_auto] items-center gap-x-3 bg-light-2 px-3 py-2 dark:bg-dark-3 sm:grid-cols-[1fr,_auto] sm:py-0">
            <button
              type="button"
              title="Back to menu"
              className="py-2 px-1 sm:hidden"
              onClick={closeNote}
            >
              <BackSVG className="h-7 w-7 stroke-dark-1 active:stroke-green dark:stroke-light-1 active:dark:stroke-pistachio" />
            </button>
            <NoteTags
              tags={tags}
              editMode={editTags}
              handleChangeTags={handleTagChange}
            />
            <div className="flex justify-self-end sm:gap-1">
              <button
                type="button"
                title="Edit tags"
                className={`${
                  editTags &&
                  "bg-green text-light-1 dark:bg-pistachio dark:text-dark-1"
                } rounded-md p-2`}
                onClick={toggleEditTags}
              >
                <TagsSVG className="h-6 w-6 fill-current" />
              </button>
              <button
                type="button"
                title="Edit note"
                className={`${
                  editNote &&
                  "bg-green text-light-1 dark:bg-pistachio dark:text-dark-1"
                } rounded-md p-2`}
                onClick={toggleEditNote}
              >
                <EditSVG className="h-6 w-6 stroke-current stroke-[1.5]" />
              </button>
              <button
                type="button"
                title="Delete note"
                className="rounded-md p-2 active:bg-green active:text-light-1 dark:active:bg-pistachio active:dark:text-dark-1"
                onClick={deleteNote}
              >
                <TrashSVG className="h-7 w-7 stroke-current stroke-2" />
              </button>
              <button
                type="submit"
                title="Save changes"
                className="rounded-md p-2 active:bg-green active:text-light-1 dark:active:bg-pistachio active:dark:text-dark-1"
              >
                <SaveSVG className="h-7 w-7 fill-current" />
              </button>
              <button
                type="button"
                title="Share note"
                className="rounded-md p-2 active:bg-green active:text-light-1 dark:active:bg-pistachio active:dark:text-dark-1"
                onClick={handleShare}
              >
                <ShareSVG className="h-6 w-6 fill-current" />
              </button>
            </div>
          </div>
          <div className="grid h-full w-full grid-rows-[4rem,_1fr] gap-[1.9rem] overflow-y-hidden bg-light-1 px-10 pb-4 pt-10 text-dark-3 dark:bg-dark-1 dark:text-light-1 sm:px-20">
            <input
              required
              className="block w-full border-b-thin bg-transparent text-3xl outline-none"
              onChange={handleNameChange}
              readOnly={!editNote}
              value={name}
            />
            <NoteBody
              editNote={editNote}
              handleContentChange={handleContentChange}
              content={content}
            />
          </div>
        </form>
      )}
    </div>
  );
}
