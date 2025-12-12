if (action === 'accept') {
  if (!isIncoming) {
    return res
      .status(403)
      .json({ error: 'Only the recipient can accept a request' });
  }

  // Mark accepted
  await prisma.contactRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' },
  });

  // Create reciprocal contacts (both directions)
  await prisma.$transaction([
    prisma.contact.upsert({
      where: {
        userId_contactUserId: {
          userId: request.fromUserId,
          contactUserId: request.toUserId,
        },
      },
      update: {},
      create: {
        userId: request.fromUserId,
        contactUserId: request.toUserId,
      },
    }),
    prisma.contact.upsert({
      where: {
        userId_contactUserId: {
          userId: request.toUserId,
          contactUserId: request.fromUserId,
        },
      },
      update: {},
      create: {
        userId: request.toUserId,
        contactUserId: request.fromUserId,
      },
    }),
  ]);

  return res.status(200).json({ ok: true, status: 'ACCEPTED' });
}
