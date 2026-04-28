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
        return Map.of("reply", responseFor(message));
    }

    private String responseFor(String message) {
        if (hasAny(message, "road accident", "accident", "crash", "bike", "car", "scooter", "hit", "takra", "takra gaya", "gir gaya", "ho gaya")) {
            return "Road accident emergency steps:\n\n1. Move to a safe area away from traffic if possible, but do not move the patient if neck or back injury is suspected.\n2. Call emergency services immediately and share the live location.\n3. Check whether the patient is conscious and breathing normally.\n4. If there is bleeding, apply firm pressure with a clean cloth.\n5. Do not remove a helmet forcefully if head or neck injury is possible.\n6. Do not give food, water, or medicine unless a doctor tells you to.\n7. Use Report Emergency Now so the case and location are saved.";
        }
        if (hasAny(message, "cpr", "not breathing", "no breathing", "breathing nahi", "saans nahi", "pulse nahi")) {
            return "CPR guidance:\n\n1. Call emergency services immediately.\n2. Check response by speaking loudly and tapping the shoulder.\n3. If the person is not breathing, give hard and fast chest compressions in the center of the chest.\n4. Rate should be about 100-120 compressions per minute, depth about 5-6 cm for an adult.\n5. If trained, give 2 rescue breaths after 30 compressions. Otherwise continue hands-only CPR.\n6. Continue until help or an AED arrives.";
        }
        if (hasAny(message, "chest", "heart", "heart attack", "breath", "breathing", "saans", "seene", "chati")) {
            return "Possible heart or breathing emergency:\n\n1. Call an ambulance immediately.\n2. Help the patient sit and rest, and loosen tight clothing.\n3. Only use aspirin or nitroglycerin if it was previously prescribed by a doctor.\n4. If the patient becomes unconscious or stops breathing, start CPR.\n5. Share live location and set the nearest hospital on the map.";
        }
        if (hasAny(message, "bleed", "bleeding", "blood", "khoon", "cut", "injury", "zakhm")) {
            return "Bleeding first aid:\n\n1. Apply firm pressure on the wound with a clean cloth or gauze.\n2. If the cloth becomes soaked, place another one on top and do not remove the first.\n3. Raise the injured part above heart level if possible.\n4. Go to the hospital urgently for heavy bleeding or deep wounds.\n5. Do not remove any object stuck in the wound; press around it instead.";
        }
        if (hasAny(message, "burn", "burns", "jala", "jal gaya", "fire", "acid")) {
            return "Burn first aid:\n\n1. Cool the burn under clean running water for 20 minutes.\n2. Do not apply ice, toothpaste, oil, or butter.\n3. Remove tight jewellery or clothing unless it is stuck to the skin.\n4. Cover with a clean non-stick cloth.\n5. Go to the hospital urgently for chemical, electrical, facial, hand, or large burns.";
        }
        if (hasAny(message, "ambulance", "hospital", "doctor", "nearest", "blood bank", "pharmacy")) {
            return "Use Live Map Tracking to find nearby hospitals, blood help, or pharmacies. Press SOS Location first, then save the case report.";
        }
        return "Tell me the emergency in simple words, for example: road accident happened, there is bleeding, the patient is not breathing, there is chest pain, or there is a burn injury. If the situation is life-threatening, call emergency services immediately and share live location.";
    }

    private boolean hasAny(String message, String... words) {
        for (String word : words) {
            if (message.contains(word)) {
                return true;
            }
        }
        return false;
    }
}
