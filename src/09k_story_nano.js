// ============================================================
// The Halvorsen refund (collected at the clinic, in person) and the last option: the nanobot protocol
// ============================================================
const NANO_COST = 50000;
function nanoDue() { const f = G.flags; return f.nanoPaid && G.day >= (f.nanoNext || 0); }
{
  const baseMenu = Doctor.menu, baseTalk = Doctor.talk;
  Doctor.menu = function () {
    const f = G.flags;
    const items = [{ t: 'Talk', r: '-4 energy', do: () => this.talk() }];
    if (f.cureLetter && !f.cureRefunded) items.push({ t: 'The Halvorsen letter', do: () => this.refund() });
    items.push({ t: 'Refill the prescription', r: '$20', disabled: () => G.money < 20 || G.pills > 10, do: () => { if (spend(20)) { G.pills += 30; UI.toast(`pills: ${G.pills}`, '#8ab0d8'); Dlg.run([say('doctor', G.day - (G.lastPill || 1) >= 3 ? "Thirty more. You stopped taking them for a while; your chest told me before you did. Two a day. They're not a cure. They're a quieter day." : "Thirty more. Two a day, with water, not coffee. I know it's coffee.")]); } } });
    if (f.cureKnown && !f.curePaid) items.push({ t: 'Pay the Halvorsen deposit', r: `$${CURE_COST}`, disabled: () => G.money < CURE_COST, do: () => this.pay() });
    if (f.nanoKnown && !f.nanoPaid) items.push({ t: 'Pay for the nanobot protocol', r: `$${NANO_COST}`, disabled: () => G.money < NANO_COST, do: () => this.payNano() });
    if (f.nanoPaid) items.push({ t: 'Get the shot', r: () => nanoDue() ? (G.day > f.nanoNext ? 'overdue' : 'due today') : `next ${weekdayName(f.nanoNext)}`, disabled: () => !nanoDue(), do: () => this.shot() });
    items.push({ t: 'Leave', do: () => { } });
    const sub = f.nanoPaid ? `NB-7 protocol. ${f.nanoShots || 0} shot${f.nanoShots === 1 ? '' : 's'} so far.` : f.nanoKnown ? `Nanobot protocol: $${G.money} of $${NANO_COST}.` : f.cureKnown && !f.curePaid ? `Halvorsen Clinic: $${G.money} of $${CURE_COST}.` : '';
    Menu.open('Dr. Okafor', items, { sub });
  };
  Doctor.refund = function () {
    const f = G.flags; f.cureRefunded = true; f.cureRefundDay = G.day; addMoney(CURE_COST); remember('cure_refunded'); f.nanoKnown = true; f.nanoKnownDay = G.day;
    Dlg.run([say('doctor', "Sit down. It's in the drawer. I've been looking at it for two days and I don't like looking at it."), narr('A cashier\'s check. Twenty thousand. Your name, spelled right, which somehow makes it worse.'),
      say('doctor', "I'm sorry about Halvorsen. I said 'queue.' I hoped I was wrong."), say('doctor', "There's one more thing, and I have thought hard about whether to say it. I'm going to say it, because you'd find it, and because it's my job."),
      say('doctor', "Targeted nanoparticle therapy. The paperwork calls it NB-7; the patients call it the nanobots. Phase two, forty patients, a seventy percent response rate. Seventy. I have never said a number like that to a patient in this room."),
      say('doctor', "Fifty thousand dollars, and it does not come back. Not if the cohort closes, not if the numbers don't move, not for any reason. I'd give it here: a shot, every other day, for as long as it takes."),
      choice({ t: "Seventy percent.", do: () => [say('doctor', "Seventy, of forty. I want you to hear the forty. Thirty percent of forty is twelve people, and I don't know their names, and nobody does.")] },
        { t: "Fifty thousand.", do: () => [say('doctor', "Fifty. I know what that number is to you. I know what twenty was. I'm not going to tell you to find it. I'm telling you it exists, because the last time I told you something existed, you did.")] },
        { t: "What do you think?", do: () => [say('doctor', "I think it's the only real number I've got left, and I think real numbers cost more than people have, and I think you should eat. That's what I think. That's always what I think.")] }),
      say('doctor', "Take the check. Take it home. Don't decide in this room; nobody should decide anything in this room.")]);
  };
  Doctor.payNano = function () {
    const f = G.flags; if (!spend(NANO_COST)) return; f.nanoPaid = true; f.nanoPaidDay = G.day; f.nanoNext = G.day + 2; f.nanoShots = 0; remember('nano_paid'); clearPortrait('you');
    Dlg.run([narr('Fifty thousand dollars. She does not read the number twice this time. She reads it once and puts it in the drawer where the other check was, and closes the drawer, and keeps her hand on it a moment.'),
      say('doctor', "Alright. The first dose is the day after tomorrow. Then every other day, here, any hour I'm in. Eat before. It's easier on a full stomach."),
      say('doctor', "I'm going to say the seventy again, so you hear it from me and not from the paperwork. Seventy. And I'm going to say the other thing: I don't know which side you're on until the scans do."),
      narr(`The next shot is ${weekdayName(f.nanoNext)}. You will not need to write it down.`)]);
  };
  Doctor.shot = function () {
    const f = G.flags; const late = G.day > f.nanoNext; f.nanoShots = (f.nanoShots || 0) + 1; if (late) f.nanoLate = (f.nanoLate || 0) + 1; f.nanoNext = G.day + 2; useEnergy(8); Audio.tone(520, 0.08, 'triangle', 0.03);
    const n = f.nanoShots; const L = [];
    if (late) L.push(say('doctor', pick(["You were due yesterday. It's not nothing; the protocol says every other day and I don't know what the particles do with a day off. Roll up your sleeve.", "A day late. I'm not going to lecture; I'm going to write it down, and I want you to know I wrote it down. Sleeve."])));
    L.push(narr(n === 1 ? 'A syringe of something the color of weak tea. It goes in slow. It does not feel like anything, which she says is normal, which she says every time after this.' : pick(['The shot. Slow. Nothing. She counts under her breath and does not know she is doing it.', 'Sleeve up, cold swab, the slow push. You have stopped watching the needle. She has not.', 'The weak-tea color. The count. A cotton ball she holds down herself for a full minute, every time.'])));
    if (n === 1) L.push(say('doctor', "That's one. Sit for five minutes; then go do whatever it is you do. Eat."));
    else if (n === 3) L.push(say('doctor', "Three. Bloodwork on Friday. I'm not looking for anything yet. I'm looking anyway."));
    else if (n === 5) L.push(say('doctor', "Five. Your oxygen's holding. Holding is the word. I'm not going to use a better one until I've earned it."));
    else if (n === 8 && G.day < 88) L.push(say('doctor', "Eight. Scans next week. I want you eating this week like the scans can see it."));
    else L.push(say('doctor', pick(["Done. Same time, two days.", "Two days. Eat.", "Done. Go on. I'll see you the day after tomorrow, and the one after that."])));
    if (n >= 8 && G.day >= 88 && !f.nanoReveal) { f.nanoReveal = true; f.nanoRevealDay = G.day; remember('nano_reveal');
      L.push(narr('She does not say anything for a while after the cotton ball. She has the scans up. She has had them up the whole time.'),
        say('doctor', "The scans. There's no change. I've looked at them four times and had the radiologist look and there's no change."),
        say('doctor', "Seventy percent. You're in the thirty. I don't have a better way to say it and I've been trying to find one since Tuesday."),
        say('doctor', "I'll keep giving the shots if you keep coming. It's the protocol, and you paid for it, and I'd rather see you every other day than not. But I won't call it anything but what it is."),
        choice({ t: "Keep giving them.", do: () => [say('doctor', "Alright. Two days.")] }, { t: "Fifty thousand.", do: () => [say('doctor', "Fifty thousand. I know. I know exactly, I've got the number in a drawer.")] }, { t: "...", do: () => [narr('She takes your hand. It is the first time she has done that in ninety days, and she does it like a doctor, which is to say properly.')] })); }
    Dlg.run(L);
  };
  Doctor.talk = function () {
    const f = G.flags;
    if (f.cureLetter && !f.cureRefunded) { if (!talkEnergy()) return; this.refund(); return; }
    if (f.nanoPaid && Math.random() < 0.6 && !f.nanoReveal) { if (!talkEnergy()) return; Dlg.run([say('doctor', fresh('doctor', [nanoDue() ? "Shot's due. Sleeve." : `Shot's ${weekdayName(f.nanoNext)}. Eat before.`, "Bloodwork's steady. Steady isn't a result. It isn't the other thing either.", "Seventy percent. I say it in the car. I don't know why I'm telling you that."]))]); return; }
    if (f.nanoReveal) { if (!talkEnergy()) return; Dlg.run([say('doctor', fresh('doctor', ["The shots are there if you want them. That's all I've got, and it's the same thing I had on day one, and I'm sorry.", "No change. I check anyway. I'll keep checking."]))]); return; }
    return baseTalk.call(this);
  };
}
