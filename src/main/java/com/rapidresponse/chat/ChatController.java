package com.rapidresponse.chat;

import java.util.Locale;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {
    @PostMapping
    public Map<String, String> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").toLowerCase(Locale.ROOT);
        String language = body.getOrDefault("language", "english").toLowerCase(Locale.ROOT);
        return Map.of("reply", responseFor(message, language));
    }

    private String responseFor(String message, String language) {
        if (hasAny(message, "road accident", "accident", "crash", "bike", "car", "scooter", "hit", "takra", "takra gaya", "gir gaya", "ho gaya")) {
            return translate(language,
                    "Hi. i am doremi. Road accident emergency steps:\n\n1. Move to a safe area away from traffic if possible, but do not move the patient if neck or back injury is suspected.\n2. Call emergency services immediately and share the live location.\n3. Check whether the patient is conscious and breathing normally.\n4. If there is bleeding, apply firm pressure with a clean cloth.\n5. Do not remove a helmet forcefully if head or neck injury is possible.\n6. Do not give food, water, or medicine unless a doctor tells you to.",
                    "Hi. i am doremi. Road accident ke liye turant steps:\n\n1. Agar safe ho to patient ko traffic se bachao, lekin neck ya back injury ka doubt ho to move mat karo.\n2. Emergency services ko turant call karo aur live location share karo.\n3. Check karo patient hosh me hai ya nahi aur breathing normal hai ya nahi.\n4. Bleeding ho to clean cloth se firm pressure lagao.\n5. Head ya neck injury ka chance ho to helmet zor se mat nikalo.\n6. Doctor ke bina pani, food ya medicine mat do.",
                    "Hi. i am doremi. Mesures d'urgence en cas d'accident de la route :\n\n1. Mettez la victime en securite loin de la circulation si possible, mais ne la deplacez pas si une blessure au cou ou au dos est suspectee.\n2. Appelez les secours immediatement et partagez la position.\n3. Verifiez si la personne est consciente et respire normalement.\n4. En cas de saignement, appliquez une pression ferme avec un tissu propre.\n5. Ne retirez pas le casque de force si une blessure a la tete ou au cou est possible.\n6. Ne donnez ni nourriture, ni eau, ni medicament sans avis medical.");
        }
        if (hasAny(message, "cpr", "not breathing", "no breathing", "breathing nahi", "saans nahi", "pulse nahi")) {
            return translate(language,
                    "Hi. i am doremi. CPR guidance:\n\n1. Call emergency services immediately.\n2. Check response by speaking loudly and tapping the shoulder.\n3. If the person is not breathing, give hard and fast chest compressions in the center of the chest.\n4. Rate should be about 100 to 120 compressions per minute.\n5. If trained, give 2 rescue breaths after 30 compressions. Otherwise continue hands-only CPR.",
                    "Hi. i am doremi. CPR guidance:\n\n1. Emergency services ko turant call karo.\n2. Patient response check karo: loudly bolo aur shoulder tap karo.\n3. Breathing nahi hai to chest ke center par hard and fast compressions do.\n4. Rate 100 se 120 compressions per minute ke aas paas rakho.\n5. Agar trained ho to 30 compressions ke baad 2 rescue breaths do, warna hands-only CPR continue karo.",
                    "Hi. i am doremi. Conseils de RCP :\n\n1. Appelez les secours immediatement.\n2. Verifiez la reaction en parlant fort et en touchant l'epaule.\n3. Si la personne ne respire pas, faites des compressions thoraciques rapides et fermes.\n4. Le rythme doit etre d'environ 100 a 120 compressions par minute.\n5. Si vous etes forme, donnez 2 insufflations apres 30 compressions, sinon continuez avec les mains seulement.");
        }
        if (hasAny(message, "chest", "heart", "heart attack", "breath", "breathing", "saans", "seene", "chati")) {
            return translate(language,
                    "Hi. i am doremi. Possible heart or breathing emergency:\n\n1. Call an ambulance immediately.\n2. Help the patient sit and rest, and loosen tight clothing.\n3. Only use aspirin or nitroglycerin if it was previously prescribed by a doctor.\n4. If the patient becomes unconscious or stops breathing, start CPR.\n5. I will also try to list nearby doctors for you.",
                    "Hi. i am doremi. Heart ya breathing emergency ho sakti hai:\n\n1. Turant ambulance call karo.\n2. Patient ko baithao, rest karne do, tight kapde loosen karo.\n3. Aspirin ya nitroglycerin tabhi do jab doctor ne pehle prescribe ki ho.\n4. Patient unconscious ho jaye ya breathing ruk jaye to CPR start karo.\n5. Main paas ke doctors bhi dhoondne ki koshish karungi.",
                    "Hi. i am doremi. Possible urgence cardiaque ou respiratoire :\n\n1. Appelez une ambulance immediatement.\n2. Aidez la personne a s'asseoir et a se reposer, et desserrez les vetements serres.\n3. Utilisez l'aspirine ou la nitroglycerine seulement si un medecin l'a deja prescrite.\n4. Si la personne perd connaissance ou arrete de respirer, commencez la RCP.\n5. Je vais aussi essayer de lister des medecins proches pour vous.");
        }
        if (hasAny(message, "burn", "burns", "jala", "jal gaya", "fire", "acid")) {
            return translate(language,
                    "Hi. i am doremi. Burn first aid:\n\n1. Cool the burn under clean running water for 20 minutes.\n2. Do not apply ice, toothpaste, oil, or butter.\n3. Remove tight jewellery or clothing unless it is stuck to the skin.\n4. Cover with a clean non-stick cloth.\n5. Go to the hospital urgently for chemical, electrical, facial, hand, or large burns.",
                    "Hi. i am doremi. Burn first aid:\n\n1. Burn area ko clean running water ke neeche 20 minutes tak cool karo.\n2. Ice, toothpaste, oil ya butter mat lagao.\n3. Tight jewellery ya clothes remove karo agar skin se chipke nahi hain.\n4. Clean non-stick cloth se loosely cover karo.\n5. Chemical, electric, face, hand ya large burn ho to urgent hospital jao.",
                    "Hi. i am doremi. Premiers soins pour les brulures :\n\n1. Refroidissez la brulure sous l'eau propre pendant 20 minutes.\n2. N'appliquez ni glace, ni dentifrice, ni huile, ni beurre.\n3. Retirez les bijoux ou vetements serres sauf s'ils collent a la peau.\n4. Couvrez avec un tissu propre non adherent.\n5. Allez d'urgence a l'hopital pour les brulures chimiques, electriques, du visage, des mains ou etendues.");
        }
        return translate(language,
                "Hi. i am doremi. Tell me the emergency in simple words and I will guide first-aid steps and try to list nearby doctors with phone numbers.",
                "Hi. i am doremi. Emergency simple words me batao, main first-aid steps guide karungi aur nearby doctors with phone numbers dhoondne ki koshish karungi.",
                "Hi. i am doremi. Decrivez l'urgence simplement et je vous guiderai avec les premiers soins et une liste de medecins proches avec leurs numeros.");
    }

    private boolean hasAny(String message, String... words) {
        for (String word : words) {
            if (message.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private String translate(String language, String english, String hindi, String french) {
        return switch (language) {
            case "hindi" -> hindi;
            case "french" -> french;
            default -> english;
        };
    }
}
