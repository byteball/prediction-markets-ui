import { createAsyncThunk } from "@reduxjs/toolkit";
import backend from "services/backend";

export const loadCategories = createAsyncThunk(
  'loadCategories',
  async () => {
    return await backend.getCategories();
  })