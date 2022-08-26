import { useState, useEffect, ChangeEvent } from "react";
import NoteTags from "./note-tags";
import { useStore } from "../lib/store";
import slugify from "../lib/utils/slugify";

export default function NoteEditor() {
  const {
    user: { signedKey },
    userNotes: { updateNote, removeNote },
    session: { openNote, setOpenNote },
  } = useStore();
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
    resetState();

    if (!openNote) return;

    setName(openNote.name);

    if (openNote.content) setContent(openNote.content);

    if (openNote.tags) setTags(openNote.tags);
  }, [openNote]);

  const saveNote = async () => {
    if (!openNote) return;

    const updatedNote = {
      ...(updateName && { name, slug: slugify(name) }),
      ...(updateContent && { content }),
      ...(updateTags && { tags }),
    };

    updateNote(openNote.id, updatedNote, signedKey);

    setUpdateName(false);
    setUpdateContent(false);
    setUpdateTags(false);
  };

  const deleteNote = async () => {
    if (!openNote) return;

    removeNote(openNote.id);
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

  const toggleEditNote = () => setEditNote((prevEditNote) => !prevEditNote);

  const toggleEditTags = async () => {
    if (!openNote) return;

    if (editTags && updateTags) {
      updateNote(openNote.id, { tags }, signedKey);
      setUpdateTags(false);
    }

    setEditTags((prevEditTags) => !prevEditTags);
  };

  return (
    <div className="w-4/5">
      {openNote && (
        <div className="flex h-full flex-col">
          <div className="flex h-[4.2rem] content-center justify-between gap-1 bg-light-2 px-3 dark:bg-dark-3">
            <NoteTags
              tags={tags}
              editMode={editTags}
              handleChangeTags={handleTagChange}
            />
            <button
              className={`${
                editTags &&
                "bg-green text-light-1 dark:bg-pistachio dark:text-dark-1"
              } p-2`}
              type="button"
              onClick={toggleEditTags}
            >
              tags
            </button>
            <button
              type="button"
              className={`${
                editNote &&
                "bg-green text-light-1 dark:bg-pistachio dark:text-dark-1"
              } p-2`}
              onClick={toggleEditNote}
            >
              edit
            </button>
            <button
              type="button"
              className="p-2 active:bg-green active:text-light-1 dark:active:bg-pistachio active:dark:text-dark-1"
              onClick={deleteNote}
            >
              delete
            </button>
            <button
              type="button"
              className="p-2 active:bg-green active:text-light-1 dark:active:bg-pistachio active:dark:text-dark-1"
              onClick={saveNote}
            >
              save
            </button>
          </div>
          <div className="bg:light-1 h-full w-full pt-10 text-dark-3 dark:bg-dark-1 dark:text-light-1">
            <input
              className="mx-auto block w-[calc(100%-10rem)] border-b-thin bg-transparent text-3xl outline-none"
              onChange={handleNameChange}
              readOnly={!editNote}
              value={name}
            />
            <textarea
              className="mt-7 block h-full w-full resize-none overflow-y-scroll bg-transparent px-20 pb-10 outline-none"
              onChange={handleContentChange}
              readOnly={!editNote}
              value={content}
            />
          </div>
        </div>
      )}
    </div>
  );
}
