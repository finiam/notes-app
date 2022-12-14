import type { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { NoteType } from "../..";
import {
  createNote,
  deleteNote,
  getNotesBySig,
  updateNote,
} from "../../lib/db";

type Data = {
  notes?: NoteType[];
  note?: NoteType;
  message?: string;
};

const handler = nc<NextApiRequest, NextApiResponse<Data>>({
  onError: (err, req, res) => {
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
})
  .get(async (req, res) => {
    const { userSig } = req.query;
    const { body } = await getNotesBySig(userSig as string);

    if (body) {
      res.status(200).json({ notes: body });
    }
  })
  .post(async (req, res) => {
    const { name, slug, folder, user } = req.body;
    const { data } = await createNote({ name, slug, folder, user });

    if (data?.length) {
      res.status(200).json({ message: "Note created", note: data[0] });
    }
  })
  .delete(async (req, res) => {
    const { id } = req.query;
    const { data } = await deleteNote(id as string);

    if (data) {
      res.status(200).json({ message: "Note deleted" });
    }
  })
  .put(async (req, res) => {
    const { id } = req.query;
    const { name, slug, tags, content } = req.body;
    const newNote = {
      name,
      slug,
      tags,
      content,
    };

    const { data } = await updateNote(id as string, newNote);

    if (data?.length) {
      res.status(200).json({ message: "Note updated", note: data[0] });
    }
  });

export default handler;
