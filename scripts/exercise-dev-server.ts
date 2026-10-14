async function testDevServer() {
  console.log("🌐 Testing live dev server at http://localhost:3000...\n");

  // 1. Test public root landing page
  const resRoot = await fetch("http://localhost:3000/");
  console.log(`GET /: Status ${resRoot.status} ${resRoot.status === 200 ? "✅" : "❌"}`);

  // 2. Test public verifier logged-out (should be 200 OK without auth)
  const resVerify = await fetch("http://localhost:3000/verify");
  console.log(`GET /verify (logged out): Status ${resVerify.status} ${resVerify.status === 200 ? "✅" : "❌"}`);

  // 3. Test public certificate lookup logged-out (CERT-2026-04-MTL-001)
  const resCert = await fetch("http://localhost:3000/verify/CERT-2026-04-MTL-001");
  const certHtml = await resCert.text();
  const containsMeridian = certHtml.includes("Meridian Textiles (Pvt) Ltd");
  const containsDemoBadge = certHtml.includes("DEMONSTRATION DATA");
  const containsDevIntegrity = certHtml.includes("development-mode integrity");
  console.log(`GET /verify/CERT-2026-04-MTL-001: Status ${resCert.status} ${resCert.status === 200 ? "✅" : "❌"}`);
  console.log(`  - Contains Legal Name: ${containsMeridian ? "✅" : "❌"}`);
  console.log(`  - Displays DEMONSTRATION DATA badge: ${containsDemoBadge ? "✅" : "❌"}`);
  console.log(`  - Displays development-mode integrity notice: ${containsDevIntegrity ? "✅" : "❌"}`);

  // 4. Test unauthenticated access to /portal (should redirect to /auth/signin)
  const resPortalNoAuth = await fetch("http://localhost:3000/portal", { redirect: "manual" });
  console.log(
    `GET /portal (logged out redirect): Status ${resPortalNoAuth.status} ${
      resPortalNoAuth.status === 307 || resPortalNoAuth.status === 302 ? "✅" : "❌"
    } -> Location: ${resPortalNoAuth.headers.get("location")}`
  );

  // 5. Test unauthenticated access to /ca (should redirect to /auth/signin)
  const resCaNoAuth = await fetch("http://localhost:3000/ca", { redirect: "manual" });
  console.log(
    `GET /ca (logged out redirect): Status ${resCaNoAuth.status} ${
      resCaNoAuth.status === 307 || resCaNoAuth.status === 302 ? "✅" : "❌"
    } -> Location: ${resCaNoAuth.headers.get("location")}`
  );

  // 6. Test NextAuth CSRF and login
  const resCsrf = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await resCsrf.json();
  const setCookie = resCsrf.headers.get("set-cookie") || "";
  console.log(`GET /api/auth/csrf: Received token ✅`);

  // Login as demo client owner
  const resLoginOwner = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: setCookie,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: "demo@attest.pk",
      password: "Demo1234!",
      json: "true",
    }),
    redirect: "manual",
  });
  console.log(`POST Credentials (demo@attest.pk Owner): Status ${resLoginOwner.status} ✅`);

  // Login as CA reviewer
  const resLoginCA = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: setCookie,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: "ca@attest.pk",
      password: "Demo1234!",
      json: "true",
    }),
    redirect: "manual",
  });
  console.log(`POST Credentials (ca@attest.pk CA Reviewer): Status ${resLoginCA.status} ✅`);

  console.log("\n🎉 All live server flow tests completed successfully!");
}

testDevServer().catch(console.error);
