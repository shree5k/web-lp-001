# Landing page content sources

## Implementation provenance

The initial layout and scroll effects were adapted from the local `ma-web`
reference project. That project is not a build or runtime dependency. Unused
branding aliases have been removed, and live theme variables use neutral names.
The shader retains its original Ornn source attribution in
`assets/js/effects/bands-background.js`. Vendor licence notices are preserved
under `assets/vendor/`. These are implementation credits, not clinic branding
or endorsements.

## Floating contact menu

Checked 31 October 2026 against the HTML and embedded contact-widget settings
on https://dranudeep.in/:

- Call: `tel:+918070607068`.
- WhatsApp: the official widget specifies `918070607068`; the site uses the
  corresponding direct link https://wa.me/918070607068.
- Instagram: the official site's linked profile is
  https://www.instagram.com/icosmeticsurgeon/.

These destinations are centralised in `assets/js/contact.js`. No third-party
widget, tracker or remote contact script is loaded, and no message is sent
automatically when a channel is opened.

Reviewed 30 October 2026. These are editorial references, not independent
verification of every claim made by the source websites.

## Surgeon introduction and qualifications

https://dranudeep.in/about/

The doctor's biography identifies him as founder of Mysore Aesthetics and lists
MBBS/MS training in Mysore, MCh training in Mumbai, DrNB Plastic Surgery and
aesthetic surgery fellowships in Colombia, Brazil and New Delhi. The landing
page presents these as training history rather than current appointments.

https://www.manipalhospitals.com/mysore/doctors/dr-anudeep-talagavadi-channaiah-plastic-surgeon/

Manipal's profile also lists MBBS, MS, MCh and DrNB. It lists Kannada, English,
Hindi and Marathi; these support the consultation language line.

## Treatment summaries and facial aesthetics details

https://dranudeep.in/services/

The doctor's services page supports the treatment examples beneath the eight
expertise categories and the expanded facial aesthetics list. These are service
descriptions, not promises of suitability or treatment outcomes.

## Confirm with the practice before adding

- Current clinic street address, entrance, map pin, direct phone and hours.
  Public listings contain different addresses; a registered office should not
  be assumed to be the patient consultation address.
- Whether the Mysore Aesthetics app is operated by this practice and is active:
  https://play.google.com/store/apps/details?id=com.docterz.connect.mysoreaesthetics
- Experience totals, publication metrics, ratings and review counts.
- Any description of consultation, surgery or follow-up arrangements that is
  not already confirmed by the practice.

## Patient-focused copy and consultation guidance

The landing page now introduces each treatment category through patient concerns,
uses full names for reconstruction and wound/vascular care, and explains training
in plain language. Procedure examples remain based on the doctor's services page.

Consultation questions about alternatives, risks, likely results, recovery,
costs and follow-up are informed by:
https://www.rcseng.ac.uk/patient-care/cosmetic-surgery/your-consultation/

This is general preparation guidance, phrased as subjects to discuss rather than
claims about the practice's confirmed consultation or follow-up arrangements.
It does not import UK registration requirements or waiting periods.

Unattributed rating stars were removed. The feedback section features a short
verbatim excerpt attributed to Yogesh BJ on https://dranudeep.in/about/ and links
to that source. This attribution follows the doctor's published website; it is
not an independently verified patient identity or a third-party rating.
The generated before/after gallery was restored at the user’s request in place
of the consultation guidance section. It remains illustrative imagery, not
clinical evidence. Obsolete archive snapshots were removed during production cleanup.
The general preparation section described above is no longer on the landing page.

The hero, booking destination and existing clinic location wording were kept
unchanged during this content update.

## Clinical expertise stock photography

Downloaded 30 October 2026 from Pexels at 700px width, JPEG quality 85,
then encoded as WebP quality 88 at unchanged dimensions. Files
are stored locally in `assets/images/expertise/`. CSS supplies the capsule crop.
These illustrate service categories; they do not depict this practice's team,
patients or results. They are decorative within explicitly labelled buttons.

License: https://www.pexels.com/license/

| Local filename | Photographer | Source |
| --- | --- | --- |
| facial-aesthetics.webp | cottonbro studio | https://www.pexels.com/photo/close-up-shot-of-a-woman-5700051/ |
| body-contouring.webp | Christina Chekhomova | https://www.pexels.com/photo/back-and-arm-of-woman-touching-her-waist-10975850/ |
| breast-surgery.webp | Ron Lach | https://www.pexels.com/photo/close-up-of-woman-collarbones-8625540/ |
| hair-restoration.webp | Hülya Ermiş Belek | https://www.pexels.com/photo/dermatologist-examining-patient-s-scalp-with-dermatoscope-40594081/ |
| cosmetic-gynecology.webp | Antoni Shkraba | https://www.pexels.com/photo/woman-consulting-a-doctor-5215008/ |
| trauma-reconstruction.webp | cottonbro studio | https://www.pexels.com/photo/a-person-getting-his-hand-bandaged-5721552/ |
| hand-microsurgery.webp | Mikhail Nilov | https://www.pexels.com/photo/close-up-of-paramedics-holding-hand-of-a-patient-8943097/ |
| specialized-care.webp | cottonbro studio | https://www.pexels.com/photo/close-up-shot-of-a-person-holding-a-bandage-5721553/ |

## Standalone services page

Source: https://dranudeep.in/services/ (read 31 October 2026).
`content/services.json` retains all 11 published categories and 46 procedure entries, with normalized capitalization and plain-language group summaries. No outcome claims, recovery estimates or new treatments were added. The hero uses the existing decorative facial-aesthetics stock image documented above, not a patient result. The source is retained here for editorial reference; the public source note was removed at the user’s request.

The new page is generated at `/services/` by `blog/services.11ty.js` and styled only by `assets/css/services.css`. Its header is derived from the shared partial at build time; the landing HTML, shared header and landing navigation are unchanged.

## Additional services imagery

Downloaded 31 October 2026, inspected locally, resized to 700px width and saved as WebP quality 88. Decorative stock photography illustrates clinical contexts; these are not this practice’s patients or results.

| Local file in `assets/images/expertise/` | Photographer | Source | License |
| --- | --- | --- | --- |
| varicose-vein-care.webp | Elen Sher | https://unsplash.com/photos/a-person-in-blue-gloves-holding-a-sys-I6DdXo0MpvY | https://unsplash.com/license |
| wound-care.webp | cottonbro studio | https://www.pexels.com/photo/a-person-getting-his-hand-bandaged-5721555/ | https://www.pexels.com/license/ |
| dialysis-access.webp | Ezebunwo Omachi | https://unsplash.com/photos/dialysis-machine-in-a-medical-setting-su-Lv2OJuY0 | https://unsplash.com/license |

The vein-care photo shows sterile syringe preparation and is tagged for varicose vein care by its photographer. It is used as a general clinical illustration, not a depiction of a particular procedure. All 11 service categories use the same subtly rounded rectangular frame; the hero’s separate decorative collage is retained.

## Instagram reels

User-selected on 31 October 2026; public Open Graph titles, captions and covers were read from the three direct reel pages. Covers are stored locally as WebP. No video files are downloaded. Instagram's public player loads only after a visitor selects a reel; an original Instagram link remains available in the dialog.

| Reel | Source credit | Topic |
| --- | --- | --- |
| https://www.instagram.com/reel/Ddq4W-WsaXK/ | @dermdoc.madhurya | Tight hairstyles and traction alopecia |
| https://www.instagram.com/reel/DdjY5cSMpeN/ | @dermdoc.madhurya | Different skin concerns and skincare |
| https://www.instagram.com/reel/Dc-Sc3dKPVc/ | @aestheticsmysore | Everyday hair-care advice |

The section explicitly credits Dr. Madhurya Santosh and the clinic; these videos are not attributed to Dr. Anudeep. Live Instagram playback is dependent on Instagram's embedding and viewer-access settings.


## About page

- Route: `/about/`. Biography, qualifications, selected clinical roles and research interests condensed from https://dranudeep.in/about/ (read 2 November 2026). Changing citation totals, teaching durations and clinic hours are omitted.
- Portrait: https://dranudeep.in/wp-content/uploads/2023/02/profile-pic-Edited-Edited-864x1024.png; downloaded from the supplied official page and converted to `assets/images/dr-anudeep.webp`, preserving transparency. Existing practice-owned portrait reused for its own site.
- Layout: page-specific `assets/css/about.css`, local GSAP entrance motion with reduced-motion support. Landing page source remains unchanged.
