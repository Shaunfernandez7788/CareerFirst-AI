export async function POST(req: Request) {
  try {
    const { role, experience } = await req.json();

    // Using a RapidAPI Job Search aggregator as an example
    const url = `https://jsearch.p.rapidapi.com/search?query=${role}%20jobs%20with%20${experience}%20years%20experience&num_pages=1`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const data = await res.json();
    return Response.json({ jobs: data.data || [] });
  } catch (error) {
    return Response.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}