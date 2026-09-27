# Neural Style Transfer Studio

A local image-to-image style-transfer application. The FastAPI backend applies Adaptive Instance Normalization (AdaIN) using a pretrained VGG encoder and decoder checkpoint. It stores uploaded, reference, and generated images in Cloudinary and saves their URLs and Cloudinary public IDs in Supabase. A Next.js frontend provides sign-in, generation, history, and deletion.

## Project Structure

```text
.
├── app.py                 # FastAPI application (ASGI entry point)
├── config.py              # Backend environment settings
├── controller/            # FastAPI routes
├── service/               # Model, Supabase, and Cloudinary operations
├── validations/           # Request validation and JWT handling
├── utils/                 # AdaIN, dataset, and model code
├── model/
│   ├── vgg_normalised.pth  # VGG encoder weights
│   └── project/            # Decoder checkpoints
├── train.py               # Decoder training script
└── frontend/              # Next.js 16 application
```

## Requirements

- Python 3.11
- `uv` for Python environment and dependency management
- Node.js and npm compatible with Next.js 16
- Supabase project with `users` and `images` tables
- Cloudinary account with image upload and delete permissions
- VGG and decoder checkpoints at the paths configured below

Model weights are local artifacts and may not be included in a source checkout. Provide the required files before starting the backend.

## Configuration

Create a `.env` file in the repository root. Use your own credentials and do not commit this file.

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

VGG_PATH=./model/vgg_normalised.pth
TRAINED_MODEL=./model/project/trained_model.pth
```

Set `TRAINED_MODEL` explicitly: the backend's fallback path is relative to a different directory. The frontend defaults to `http://localhost:8000`. To change it, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Restart the relevant development server after changing environment variables.

## Run Locally

From the repository root, create and populate the Python environment:

```powershell
uv sync
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
```

Start FastAPI in one terminal:

```powershell
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Install and start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. The FastAPI health endpoint is <http://localhost:8000/> and its interactive documentation is <http://localhost:8000/docs>.

The frontend sends login requests to FastAPI. It stores the returned JWT in a same-origin HttpOnly cookie. Next.js route handlers forward protected history, generation, and deletion requests to FastAPI using the `Bearer-auth` header. Next.js Proxy redirects page requests without a session cookie to `/login`.

## API

Protected FastAPI endpoints require the raw JWT in this header:

```http
Bearer-auth: <access-token>
```

### Sign In

```http
POST /user/login
Content-Type: application/json

{"name":"Example User","email":"user@example.com"}
```

The response is a JSON-encoded access-token string. The current endpoint looks up or creates a user by email; it does **not** verify a password or prove ownership of that email. This authentication flow is suitable only for a trusted prototype, not a public production service.

### Generate an Image

```http
POST /agent/generate
Bearer-auth: <access-token>
Content-Type: multipart/form-data

content_image=<JPEG, PNG, or WebP file, up to 3 MB>
style_image=<JPEG, PNG, or WebP file, up to 3 MB>
alpha=<number from 0 to 1>
```

The response is a JSON-encoded URL string for the generated image. The backend uploads the content image, style image, and generated result to Cloudinary, then inserts a row into Supabase's `images` table.

### Read Account and Image History

```http
GET /user/access
Bearer-auth: <access-token>
```

The response contains the user's `name`, `email`, and an `images` array. Each valid image record includes `id`, `content_image`, `style_image`, and `generated_image`. Incomplete legacy rows are omitted.

### Delete a Generation

```http
DELETE /agent/remove?img_id=<image-row-id>
Bearer-auth: <access-token>
```

The backend verifies that the image belongs to the requesting user, deletes its three Cloudinary assets using their stored public IDs, and then deletes the Supabase row. The response is `{ "deleted": true, "image_id": "..." }`.

## Storage Setup

The backend expects:

- `users`: at least `id`, `name`, and `email` columns; sign-in looks up accounts by email.
- `images`: an ID column, `user_id`, `content_image`, `style_image`, `generated_image`, `content_key`, `style_key`, and `generated_key` columns. The `*_image` columns contain secure Cloudinary URLs; the `*_key` columns contain Cloudinary public IDs used for deletion.

Configure Supabase policies and credentials to allow the backend's required user lookup/insert and image select/insert/delete operations. The app uses its own JWT and does not pass a Supabase Auth session. If Row Level Security is enabled, account for that in the policies; alternatively, use a server-only Supabase service-role key and never expose it to the browser.

The Cloudinary API key must allow image creation and deletion. If Cloudinary deletion fails, the database row is retained so the operation can be retried.

## Training

`train.py` expects flat directories of `.png`, `.jpg`, or `.jpeg` files; the dataset loader does not search nested directories. Set `CONTENT_DIR`, `STYLE_DIR`, and `VGG_PATH` in the root `.env`, or pass `--content_dir`, `--style_dir`, and `--vgg` arguments. Run from the repository root, for example:

```powershell
uv run python train.py --content_dir ./data/content --style_dir ./data/style --vgg ./model/vgg_normalised.pth --experiment project
```

The script resumes from `model/<experiment>/trained_model.pth` by default. Ensure that checkpoint exists before training; starting a fresh experiment requires changing the resume behavior in `train.py`. Checkpoints and preview outputs are written under `model/<experiment>/`.

## Frontend Checks

Run from `frontend/`:

```bash
npm run lint
npm run build
```